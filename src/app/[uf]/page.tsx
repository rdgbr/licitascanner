import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { UFS, ufNome } from "@/lib/ufs";
import { formatBRL, licitacaoSlug } from "@/lib/pncp";
import { MapPin, ArrowRight , AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { semValorEstimadoIrregular } from "@/lib/qualidade";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ uf: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uf } = await params;
  const nome = ufNome(uf.toUpperCase());
  if (!nome) return {};
  return {
    title: `Licitações em ${nome} — Editais Públicos ${new Date().getFullYear()}`,
    description: `Acompanhe todos os editais e licitações públicas do estado de ${nome}. Pregão eletrônico, concorrência, dispensa. Alertas grátis via LicitaScanner.`,
    alternates: { canonical: `https://licitascanner.com.br/${uf.toLowerCase()}` },
  };
}

export default async function UfPage({ params }: Props) {
  const { uf } = await params;
  const ufUpper = uf.toUpperCase();
  const nome = ufNome(ufUpper);
  if (!nome || nome === ufUpper) notFound();

  const [total, recentes, municipios, modalidades] = await Promise.all([
    prisma.licitacao.count({ where: { uf: ufUpper } }),
    prisma.licitacao.findMany({
      where: { uf: ufUpper },
      orderBy: { dataPublicacao: "desc" },
      take: 20,
      select: { id: true, objeto: true, orgaoNome: true, municipio: true, modalidadeNome: true, valorEstimado: true, dataPublicacao: true, situacao: true, fonte: true },
    }),
    prisma.licitacao.groupBy({
      by: ["municipio"],
      where: { uf: ufUpper, municipio: { not: null } },
      _count: true,
      orderBy: { _count: { municipio: "desc" } },
      take: 20,
    }),
    prisma.licitacao.groupBy({
      by: ["modalidadeNome"],
      where: { uf: ufUpper },
      _count: true,
      orderBy: { _count: { modalidadeNome: "desc" } },
      take: 6,
    }),
  ]);

  const SITE_URL = "https://licitascanner.com.br";
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "LicitaScanner", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: nome, item: `${SITE_URL}/${uf.toLowerCase()}` },
    ],
  };
  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Licitações em ${nome}`,
    description: `Editais e licitações públicas do estado de ${nome} — PNCP.`,
    url: `${SITE_URL}/${uf.toLowerCase()}`,
    numberOfItems: total,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1">
          <Link href="/" className="hover:text-[#0F4C81]">LicitaScanner</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">{nome}</span>
        </nav>

        <div className="flex items-start gap-3 mb-8">
          <div className="rounded-xl bg-[#0F4C81]/10 p-3">
            <MapPin className="h-6 w-6 text-[#0F4C81]" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Licitações em {nome}</h1>
            <p className="mt-1 text-slate-500">
              {total.toLocaleString("pt-BR")} editais públicos
            </p>
          </div>
        </div>

        {/* Modalidades */}
        {modalidades.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {modalidades.map((m) => (
              <span key={m.modalidadeNome} className="rounded-full bg-[#0F4C81]/10 text-[#0F4C81] text-xs px-3 py-1 font-medium">
                {m.modalidadeNome} ({m._count})
              </span>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Editais */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Editais recentes</h2>
            <div className="space-y-3">
              {recentes.map((l) => (
                <Link
                  key={l.id}
                  href={`/edital/${licitacaoSlug(l.id)}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0F4C81] hover:shadow-sm transition group"
                >
                  <div className="text-[11px] uppercase tracking-wider text-[#0F4C81] font-semibold flex flex-wrap items-center justify-between gap-1">
                    <span className="flex items-center gap-2">
                      <span>{l.modalidadeNome}</span>
                      {l.fonte !== "pncp" && (
                        <span className="normal-case text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Diário Oficial Municipal
                        </span>
                      )}
                    </span>
                  {semValorEstimadoIrregular(l.modalidadeNome, l.valorEstimado) && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                      <AlertTriangle className="h-2.5 w-2.5" /> Sem valor estimado
                    </span>
                  )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${l.situacao === "Encerrada" ? "bg-slate-100 text-slate-500" : "bg-green-100 text-green-700"}`}>
                      {l.situacao}
                    </span>
                  </div>
                  <div className="mt-1 font-medium text-slate-900 line-clamp-2 group-hover:text-[#0F4C81]">
                    {l.objeto}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{l.orgaoNome?.slice(0, 40)}</span>
                    {l.valorEstimado != null && (
                      <span className="font-semibold text-slate-700">{formatBRL(l.valorEstimado)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href={`/buscar?uf=${ufUpper}`}
              className="mt-6 inline-flex items-center gap-2 text-[#0F4C81] text-sm font-medium hover:underline"
            >
              Ver todos os editais de {nome} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Municípios */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Municípios</h2>
            <div className="space-y-1">
              {municipios.map((m) => {
                const slug = (m.municipio || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
                return (
                  <Link
                    key={m.municipio}
                    href={`/${uf.toLowerCase()}/${slug}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 transition text-sm"
                  >
                    <span className="text-slate-700">{m.municipio}</span>
                    <span className="text-xs text-[#0F4C81] font-semibold">{m._count}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                href="/cadastro"
                className="block w-full text-center bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-4 py-3 transition"
              >
                🔔 Alertas grátis em {nome}
              </Link>
              <p className="mt-2 text-center text-[11px] text-slate-400">5 alertas grátis para sempre</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
