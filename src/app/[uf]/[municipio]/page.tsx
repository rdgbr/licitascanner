import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { UFS, ufNome } from "@/lib/ufs";
import { formatBRL, licitacaoSlug } from "@/lib/pncp";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ uf: string; municipio: string }> };

function slugToNome(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uf, municipio } = await params;
  const nome = ufNome(uf.toUpperCase());
  const cidade = slugToNome(municipio);
  return {
    title: `Licitações em ${cidade}/${uf.toUpperCase()} — Editais Públicos`,
    description: `Editais e licitações públicas de ${cidade}, ${nome}. Pregão eletrônico, concorrência e mais. Alertas grátis no LicitaScanner.`,
    alternates: { canonical: `https://licitascanner.com.br/${uf.toLowerCase()}/${municipio}` },
  };
}

export default async function MunicipioPage({ params }: Props) {
  const { uf, municipio } = await params;
  const ufUpper = uf.toUpperCase();
  const nome = ufNome(ufUpper);
  if (!nome || nome === ufUpper) notFound();

  const cidadeSlug = municipio.toLowerCase();

  const editais = await prisma.licitacao.findMany({
    where: {
      uf: ufUpper,
      municipio: { contains: slugToNome(cidadeSlug).slice(0, 8), mode: "insensitive" },
    },
    orderBy: { dataPublicacao: "desc" },
    take: 30,
    select: { id: true, objeto: true, orgaoNome: true, municipio: true, modalidadeNome: true, valorEstimado: true, dataPublicacao: true, situacao: true, fonte: true },
  });

  const cidadeNome = editais[0]?.municipio || slugToNome(cidadeSlug);

  const SITE_URL = "https://licitascanner.com.br";
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "LicitaScanner", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: nome, item: `${SITE_URL}/${uf.toLowerCase()}` },
      { "@type": "ListItem", position: 3, name: cidadeNome, item: `${SITE_URL}/${uf.toLowerCase()}/${municipio}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1">
          <Link href="/" className="hover:text-[#0F4C81]">LicitaScanner</Link>
          <span>/</span>
          <Link href={`/${uf.toLowerCase()}`} className="hover:text-[#0F4C81]">{nome}</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">{cidadeNome}</span>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Licitações em {cidadeNome}/{ufUpper}
        </h1>
        <p className="text-slate-500 mb-8">{editais.length} editais encontrados</p>

        {editais.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-slate-500">Nenhum edital encontrado para este município ainda.</p>
            <Link href={`/${uf.toLowerCase()}`} className="mt-4 inline-flex text-[#0F4C81] text-sm font-medium hover:underline">
              Ver todos os editais de {nome}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {editais.map((l) => (
              <Link
                key={l.id}
                href={`/edital/${licitacaoSlug(l.id)}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0F4C81] hover:shadow-sm transition group"
              >
                <div className="text-[11px] uppercase tracking-wider text-[#0F4C81] font-semibold flex justify-between">
                  <span className="flex items-center gap-2">
                    <span>{l.modalidadeNome}</span>
                    {l.fonte !== "pncp" && (
                      <span className="normal-case text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Diário Oficial Municipal
                      </span>
                    )}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${l.situacao === "Encerrada" ? "bg-slate-100 text-slate-500" : "bg-green-100 text-green-700"}`}>
                    {l.situacao}
                  </span>
                </div>
                <div className="mt-1 font-medium text-slate-900 line-clamp-2 group-hover:text-[#0F4C81]">{l.objeto}</div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>{l.orgaoNome?.slice(0, 50)}</span>
                  {l.valorEstimado != null && <span className="font-semibold text-slate-700">{formatBRL(l.valorEstimado)}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-xl bg-[#0F4C81]/5 border border-[#0F4C81]/20 p-6 text-center">
          <p className="font-medium text-slate-900">Receba alertas de novos editais em {cidadeNome}</p>
          <Link
            href="/cadastro"
            className="mt-3 inline-flex items-center gap-2 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-5 h-10 transition"
          >
            Criar conta grátis · 5 alertas para sempre
          </Link>
        </div>
      </div>
    </>
  );
}
