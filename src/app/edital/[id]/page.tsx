import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/pncp";
import { Calendar, Building2, MapPin, ExternalLink, Bell, AlertTriangle, Clock } from "lucide-react";
import type { Metadata } from "next";
import { semValorEstimadoIrregular, diasParadoSemAtualizacao } from "@/lib/qualidade";

export const revalidate = 86400;
export const dynamicParams = true;

type Props = { params: Promise<{ id: string }> };

function slugToId(slug: string) {
  return slug.replace(/-(\d+\/\d+)$/, "/$1").replace(/--/g, "/");
}

const METADATA_SITE_URL = "https://licitascanner.com.br";

// Trunca no limite de palavra mais próximo (nunca no meio de uma palavra) e
// só adiciona "…" quando o texto realmente foi cortado.
function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const licitacao = await prisma.licitacao.findFirst({
    where: { id: { contains: id.slice(0, 20) } },
    select: {
      objeto: true,
      orgaoNome: true,
      uf: true,
      municipio: true,
      valorEstimado: true,
      dataEncerramento: true,
    },
  });
  if (!licitacao) return {};
  // objeto vem do PNCP/Diário Oficial e às vezes traz quebras de linha cruas —
  // normaliza pra um único espaço antes de usar em title/description.
  const objeto = licitacao.objeto.replace(/\s+/g, " ").trim();
  const orgao = (licitacao.orgaoNome || "").replace(/\s+/g, " ").trim();
  const localizacao = [licitacao.municipio, licitacao.uf].filter(Boolean).join("/");

  // Title: objeto + órgão, sempre cortados no limite de palavra mais próximo.
  // Antes usava .slice() bruto nos dois campos e cortava no meio da palavra
  // (ex.: "...PRESTAÇÃO DE SERVI — FUNDO MUNICIPAL DE SA"), o que passa
  // impressão de link quebrado na SERP e derruba CTR mesmo em boa posição.
  const tituloObjeto = truncateAtWord(objeto, 50);
  const tituloOrgao = truncateAtWord(orgao, 25);
  const title = tituloOrgao ? `${tituloObjeto} — ${tituloOrgao}` : tituloObjeto;

  // Description: monta em blocos por prioridade e só inclui o próximo bloco
  // se ele couber inteiro no limite de 160 — nunca corta frase/palavra ao
  // meio. Valor estimado e prazo de encerramento entram logo após o objeto
  // porque são os dois dados que mais convertem clique em edital público
  // (o bucket de posição 4-10, 78,7% do inventário, tinha CTR 6-10x abaixo
  // do esperado mostrando só o objeto genérico).
  // Remove ponto final que às vezes já vem no objeto bruto do PNCP, senão o
  // bloco fecha com ".." quando o texto não precisou ser truncado.
  const objetoDesc = truncateAtWord(objeto, 100).replace(/\.+$/, "");
  const blocos: string[] = [`Edital: ${objetoDesc}${objetoDesc.endsWith("…") ? "" : "."}`];
  if (licitacao.valorEstimado != null) {
    blocos.push(`Valor estimado: ${formatBRL(licitacao.valorEstimado)}.`);
  }
  // situacao no banco frequentemente fica desatualizada (edital já venceu mas
  // segue "Divulgada no PNCP" — o mesmo problema que a página já sinaliza via
  // diasParadoSemAtualizacao). Por isso o filtro real aqui é a própria data,
  // não o campo situacao: nunca anunciar "encerra em" pra um prazo já passado.
  if (licitacao.dataEncerramento && new Date(licitacao.dataEncerramento) > new Date()) {
    blocos.push(`Encerra em ${new Date(licitacao.dataEncerramento).toLocaleDateString("pt-BR")}.`);
  }
  blocos.push(`Órgão: ${orgao}.${localizacao ? ` ${localizacao}.` : ""}`);

  let description = "";
  for (const bloco of blocos) {
    const proximo = description ? `${description} ${bloco}` : bloco;
    if (proximo.length > 160) break;
    description = proximo;
  }

  return {
    title,
    description,
    alternates: { canonical: `${METADATA_SITE_URL}/edital/${id}` },
  };
}

export default async function EditalPage({ params }: Props) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  const licitacao = await prisma.licitacao.findFirst({
    where: {
      OR: [
        { id: decodedId },
        { id: decodedId.replace(/-(\d{4})$/, "/$1") },
        { id: { startsWith: decodedId.slice(0, 30) } },
      ],
    },
  });

  if (!licitacao) notFound();

  const SITE_URL = "https://licitascanner.com.br";
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "LicitaScanner", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: licitacao.uf || "Brasil", item: `${SITE_URL}/${(licitacao.uf || "").toLowerCase()}` },
      { "@type": "ListItem", position: 3, name: licitacao.objeto.slice(0, 40), item: `${SITE_URL}/edital/${id}` },
    ],
  };

  const governmentService = {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: licitacao.objeto.slice(0, 110),
    description: licitacao.objeto,
    provider: {
      "@type": "GovernmentOrganization",
      name: licitacao.orgaoNome,
      identifier: licitacao.orgaoCnpj || undefined,
    },
    areaServed: { "@type": "State", name: licitacao.uf || "Brasil" },
    availableChannel: licitacao.linkSistema
      ? { "@type": "ServiceChannel", serviceUrl: licitacao.linkSistema }
      : undefined,
  };

  const rawData = licitacao.raw as Record<string, unknown> | null;
  const semValor = semValorEstimadoIrregular(licitacao.modalidadeNome, licitacao.valorEstimado);
  const diasParado = diasParadoSemAtualizacao(licitacao.situacao, licitacao.dataEncerramento);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(governmentService) }} />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1 flex-wrap">
          <Link href="/" className="hover:text-[#0F4C81]">LicitaScanner</Link>
          <span>/</span>
          {licitacao.uf && (
            <>
              <Link href={`/${licitacao.uf.toLowerCase()}`} className="hover:text-[#0F4C81]">{licitacao.uf}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-700 truncate max-w-xs">{licitacao.objeto.slice(0, 40)}…</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#0F4C81] bg-[#0F4C81]/10 px-2 py-1 rounded-full">
              {licitacao.modalidadeNome}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${licitacao.situacao === "Encerrada" ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-700"}`}>
              {licitacao.situacao}
            </span>
            {licitacao.fonte !== "pncp" && (
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700">
                Diário Oficial Municipal
              </span>
            )}
          </div>
          {(semValor || diasParado) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {semValor && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Sem valor estimado — exigido por lei em contratação direta (arts. 29/72, Lei 14.133/2021)
                </span>
              )}
              {diasParado && (
                <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="h-3.5 w-3.5" />
                  Prazo encerrado há {diasParado} dias sem atualização de situação no PNCP
                </span>
              )}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            {licitacao.objeto}
          </h1>
        </div>

        {/* Info cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3">
            <Building2 className="h-5 w-5 text-[#0F4C81] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-slate-500 mb-1">Órgão contratante</div>
              <div className="font-medium text-slate-900">{licitacao.orgaoNome}</div>
              {licitacao.orgaoCnpj && (
                <>
                  <div className="text-xs text-slate-500 mt-1">CNPJ: {licitacao.orgaoCnpj}</div>
                  <Link
                    href={`https://juridicoonline.com.br/empresa/${licitacao.orgaoCnpj}`}
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-[#0F4C81] hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    Ver perfil completo no Jurídico Online <ExternalLink className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3">
            <MapPin className="h-5 w-5 text-[#0F4C81] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-slate-500 mb-1">Local</div>
              <div className="font-medium text-slate-900">{licitacao.municipio || "—"}/{licitacao.uf || "—"}</div>
            </div>
          </div>

          {licitacao.valorEstimado != null && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs text-slate-500 mb-1">Valor estimado</div>
              <div className="text-xl font-bold text-slate-900">{formatBRL(licitacao.valorEstimado)}</div>
              {licitacao.valorHomologado != null && (
                <div className="text-xs text-slate-500 mt-1">Homologado: {formatBRL(licitacao.valorHomologado)}</div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3">
            <Calendar className="h-5 w-5 text-[#0F4C81] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-slate-500 mb-1">Datas</div>
              <div className="text-sm text-slate-900">
                Publicado: {new Date(licitacao.dataPublicacao).toLocaleDateString("pt-BR")}
              </div>
              {licitacao.dataAbertura && (
                <div className="text-sm text-slate-600">
                  Abertura: {new Date(licitacao.dataAbertura).toLocaleDateString("pt-BR")}
                </div>
              )}
              {licitacao.dataEncerramento && (
                <div className="text-sm text-slate-600">
                  Encerramento: {new Date(licitacao.dataEncerramento).toLocaleDateString("pt-BR")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categoria */}
        {rawData?.categoria ? (
          <div className="mb-6">
            <Link
              href={`/categoria/${String(rawData.categoria)}`}
              className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs px-3 py-1 font-medium hover:bg-[#10B981]/20"
            >
              Categoria: {String(rawData.categoria).toUpperCase()}
            </Link>
          </div>
        ) : null}

        {/* Links */}
        <div className="flex flex-wrap gap-3 mb-8">
          {licitacao.linkSistema && (
            <a
              href={licitacao.linkSistema}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-5 h-11 transition"
            >
              Acessar edital no PNCP <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {licitacao.linkEdital && licitacao.linkEdital !== licitacao.linkSistema && (
            <a
              href={licitacao.linkEdital}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#0F4C81] text-[#0F4C81] hover:bg-[#0F4C81]/5 text-sm font-medium rounded-lg px-5 h-11 transition"
            >
              {licitacao.fonte === "diario_oficial" ? "Ver diário oficial original" : "Ver edital original"} <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {/* CTA alerta */}
        <div className="rounded-2xl bg-gradient-to-br from-[#10B981]/10 to-[#0F4C81]/10 border border-[#0F4C81]/20 p-6 flex flex-col sm:flex-row items-center gap-4">
          <Bell className="h-10 w-10 text-[#0F4C81] shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold text-slate-900">Receba alertas de editais similares</p>
            <p className="text-sm text-slate-500 mt-1">Configure uma palavra-chave ou CNAE e receba e-mail quando sair novo edital.</p>
          </div>
          <Link
            href="/cadastro"
            className="shrink-0 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-5 h-10 inline-flex items-center transition"
          >
            Criar alerta grátis
          </Link>
        </div>

        {/* Rede Jurídico — cross-platform deep links */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={`https://juridicoonline.com.br/buscar?q=${encodeURIComponent(licitacao.orgaoNome)}`}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0F4C81]/40 hover:bg-[#0F4C81]/5 transition group"
          >
            <span className="size-9 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] inline-flex items-center justify-center flex-shrink-0 text-xs font-bold">JO</span>
            <div>
              <div className="text-sm font-semibold text-slate-800 group-hover:text-[#0F4C81]">Consultar {licitacao.orgaoNome}</div>
              <div className="text-xs text-slate-500 mt-0.5">Dados do órgão contratante — CNPJ, responsáveis e histórico na Receita Federal.</div>
            </div>
          </a>
          <a
            href={`https://juridicoempauta.com.br/buscar?q=${encodeURIComponent(licitacao.orgaoNome)}`}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-[#10B981]/50 hover:bg-[#10B981]/5 transition group"
          >
            <span className="size-9 rounded-lg bg-[#10B981]/10 text-[#10B981] inline-flex items-center justify-center flex-shrink-0 text-xs font-bold">JP</span>
            <div>
              <div className="text-sm font-semibold text-slate-800 group-hover:text-[#0F4C81]">Atos oficiais — {licitacao.orgaoNome}</div>
              <div className="text-xs text-slate-500 mt-0.5">Portarias, contratos e nomeações publicados em diários oficiais por este órgão.</div>
            </div>
          </a>
        </div>
      </div>
    </>
  );
}
