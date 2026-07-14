import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CATEGORIAS_META } from "@/lib/categorias";
import { UFS } from "@/lib/ufs";
import { formatBRL, licitacaoSlug } from "@/lib/pncp";
import { Search, Filter , AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { semValorEstimadoIrregular } from "@/lib/qualidade";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  uf?: string;
  categoria?: string;
  situacao?: string;
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = sp.q || "";
  return {
    title: q ? `"${q}" — Busca de Licitações` : "Buscar Licitações Públicas",
    description: "Busque editais e licitações públicas do Brasil por palavra-chave, estado ou categoria. Dados oficiais PNCP.",
    robots: q ? "noindex" : "index,follow",
  };
}

const RESULT_SELECT = {
  id: true,
  objeto: true,
  orgaoNome: true,
  municipio: true,
  uf: true,
  modalidadeNome: true,
  valorEstimado: true,
  dataPublicacao: true,
  situacao: true,
  cnaePrincipal: true,
  fonte: true,
} satisfies Prisma.LicitacaoSelect;

type ResultRow = Prisma.LicitacaoGetPayload<{ select: typeof RESULT_SELECT }>;

export default async function BuscarPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const uf = (sp.uf || "").toUpperCase();
  const categoria = sp.categoria || "";
  const situacao = sp.situacao || "";

  let editais: ResultRow[] = [];
  let total = 0;

  if (q.length >= 2) {
    // Full-text search via GIN index (licitacao_objeto_fts) em vez de ILIKE full scan.
    // q sempre entra como parâmetro do template tag — nunca concatenado em string.
    const conditions: Prisma.Sql[] = [
      Prisma.sql`to_tsvector('portuguese', objeto) @@ websearch_to_tsquery('portuguese', ${q})`,
    ];
    if (uf) conditions.push(Prisma.sql`uf = ${uf}`);
    if (categoria) conditions.push(Prisma.sql`"cnaePrincipal" = ${categoria}`);
    if (situacao) conditions.push(Prisma.sql`situacao ILIKE ${"%" + situacao + "%"}`);
    const whereSql = Prisma.join(conditions, " AND ");

    const [rankedIds, countRows] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT id FROM "Licitacao"
        WHERE ${whereSql}
        ORDER BY ts_rank(to_tsvector('portuguese', objeto), websearch_to_tsquery('portuguese', ${q})) DESC
        LIMIT 30
      `),
      prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
        SELECT count(*)::bigint AS count FROM "Licitacao" WHERE ${whereSql}
      `),
    ]);

    total = Number(countRows[0]?.count ?? 0);
    const ids = rankedIds.map((r) => r.id);
    if (ids.length > 0) {
      const rows = await prisma.licitacao.findMany({
        where: { id: { in: ids } },
        select: RESULT_SELECT,
      });
      const byId = new Map(rows.map((r) => [r.id, r]));
      // Reordena pelo rank de relevância retornado pela query FTS (findMany não preserva ordem de IN).
      editais = ids.map((id) => byId.get(id)).filter((r): r is ResultRow => Boolean(r));
    }
  } else {
    const where: Record<string, unknown> = {};
    if (uf) where.uf = uf;
    if (categoria) where.cnaePrincipal = categoria;
    if (situacao) where.situacao = { contains: situacao, mode: "insensitive" };

    const [rows, count] = await Promise.all([
      prisma.licitacao.findMany({
        where,
        orderBy: { dataPublicacao: "desc" },
        take: 30,
        select: RESULT_SELECT,
      }),
      prisma.licitacao.count({ where }),
    ]);
    editais = rows;
    total = count;
  }



  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        {q ? `Resultados para "${q}"` : "Buscar Licitações"}
      </h1>

      {/* Search form */}
      <form method="GET" action="/buscar" className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Palavra-chave, objeto, órgão..."
              className="w-full pl-10 pr-4 h-11 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 text-sm"
            />
          </div>
          <select
            name="uf"
            defaultValue={uf}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30"
          >
            <option value="">Todos os estados</option>
            {UFS.map((u) => (
              <option key={u.sigla} value={u.sigla}>{u.nome}</option>
            ))}
          </select>
          <select
            name="categoria"
            defaultValue={categoria}
            className="h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30"
          >
            <option value="">Todas as categorias</option>
            {CATEGORIAS_META.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="h-11 px-5 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg transition inline-flex items-center gap-2"
          >
            <Filter className="h-4 w-4" /> Buscar
          </button>
        </div>
      </form>

      {/* Results count */}
      <p className="text-sm text-slate-500 mb-4">
        {total.toLocaleString("pt-BR")} editais encontrados
        {q && <span> para <strong>"{q}"</strong></span>}
        {uf && <span> em <strong>{uf}</strong></span>}
      </p>

      {/* Results */}
      {editais.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <Search className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum edital encontrado. Tente outros termos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {editais.map((l) => (
            <Link
              key={l.id}
              href={`/edital/${licitacaoSlug(l.id)}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0F4C81] hover:shadow-sm transition group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#0F4C81] font-semibold">{l.modalidadeNome}</span>
                    {l.fonte !== "pncp" && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Diário Oficial Municipal
                      </span>
                    )}
                  </div>
                  {semValorEstimadoIrregular(l.modalidadeNome, l.valorEstimado) && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-2.5 w-2.5" /> Sem valor estimado
                    </span>
                  )}
                  <div className="font-medium text-slate-900 line-clamp-2 group-hover:text-[#0F4C81]">{l.objeto}</div>
                  <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-x-3">
                    <span>{l.orgaoNome?.slice(0, 40)}</span>
                    {l.municipio && <span>{l.municipio}/{l.uf}</span>}
                    <span>{new Date(l.dataPublicacao).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {l.valorEstimado != null && (
                    <div className="font-semibold text-slate-700 text-sm">{formatBRL(l.valorEstimado)}</div>
                  )}
                  <div className={`mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${l.situacao === "Encerrada" ? "bg-slate-100 text-slate-500" : "bg-green-100 text-green-700"}`}>
                    {l.situacao}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 rounded-xl bg-[#0F4C81]/5 border border-[#0F4C81]/20 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-medium text-slate-900">Salve esta busca como alerta</p>
          <p className="text-sm text-slate-500">Receba por e-mail quando saírem novos editais para "{q || "sua busca"}"</p>
        </div>
        <Link
          href={`/cadastro?termo=${encodeURIComponent(q)}&uf=${uf}`}
          className="shrink-0 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-5 h-10 inline-flex items-center transition"
        >
          Criar alerta grátis
        </Link>
      </div>
    </div>
  );
}
