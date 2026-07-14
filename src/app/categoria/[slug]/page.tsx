import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatBRL, licitacaoSlug } from "@/lib/pncp";
import type { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;
export const dynamic = "force-dynamic";

const CATEGORIAS: Record<string, { label: string; desc: string; emoji: string }> = {
  saas: { label: "Software como Serviço (SaaS)", desc: "Licitações para contratação de plataformas SaaS, sistemas em nuvem e assinaturas de software", emoji: "☁️" },
  crm_erp: { label: "CRM e ERP", desc: "Editais para sistemas de gestão empresarial, ERP, CRM, folha de pagamento", emoji: "🏢" },
  desenvolvimento: { label: "Desenvolvimento de Software", desc: "Contratos para desenvolvimento de sistemas, aplicações, portais web e apps móveis", emoji: "💻" },
  hospedagem: { label: "Hospedagem e Infraestrutura TI", desc: "Editais para hosting, cloud, data center, firewalls e servidores", emoji: "🖥️" },
  suporte: { label: "Suporte e Manutenção TI", desc: "Contratos para helpdesk, service desk e suporte técnico", emoji: "🔧" },
  consultoria_ti: { label: "Consultoria de TI", desc: "Licitações para governança, arquitetura de sistemas e projetos de TI", emoji: "📋" },
  api_integracao: { label: "APIs e Integrações", desc: "Contratos para middleware, webservices e integração de sistemas", emoji: "🔗" },
  marketing: { label: "Marketing Digital", desc: "Licitações para redes sociais, publicidade digital e comunicação online", emoji: "📣" },
  obras_engenharia: { label: "Obras e Engenharia", desc: "Editais de construção civil, pavimentação, reforma e obras de infraestrutura", emoji: "🏗️" },
  saude: { label: "Saúde", desc: "Medicamentos, equipamentos médicos, serviços de saúde e laboratórios", emoji: "🏥" },
  educacao: { label: "Educação", desc: "Material escolar, equipamentos pedagógicos e serviços educacionais", emoji: "📚" },
  veiculos_frota: { label: "Veículos e Frota", desc: "Aquisição, manutenção e combustível para frota de veículos", emoji: "🚗" },
  alimentacao: { label: "Alimentação e Gêneros", desc: "Merenda escolar, gêneros alimentícios e refeições", emoji: "🍽️" },
  limpeza_conservacao: { label: "Limpeza e Conservação", desc: "Serviços de limpeza, higienização e conservação predial", emoji: "🧹" },
  seguranca_vigilancia: { label: "Segurança e Vigilância", desc: "Vigilância armada, monitoramento e CFTV", emoji: "🛡️" },
  eventos_cultura: { label: "Eventos e Cultura", desc: "Shows artísticos, eventos, festas e produções culturais", emoji: "🎭" },
  mobiliario_equipamentos: { label: "Mobiliário e Equipamentos", desc: "Móveis, eletrodomésticos e equipamentos de escritório", emoji: "🪑" },
  material_expediente: { label: "Material de Expediente", desc: "Papelaria, material de escritório e impressão", emoji: "📎" },
  energia_eletrica: { label: "Energia Elétrica", desc: "Infraestrutura elétrica, iluminação pública e energia solar", emoji: "⚡" },
  transporte: { label: "Transporte e Logística", desc: "Transporte escolar, frete, passagens e serviços de logística", emoji: "🚌" },
  publicidade_impressao: { label: "Publicidade e Impressão", desc: "Material gráfico, publicidade institucional e sinalização", emoji: "📰" },
  combustivel_lubrificantes: { label: "Combustível e Lubrificantes", desc: "Abastecimento de frota, combustíveis e lubrificantes", emoji: "⛽" },
  hardware_informatica: { label: "Hardware e Informática", desc: "Computadores, impressoras, redes e periféricos", emoji: "🖨️" },
  uniforme_vestuario: { label: "Uniformes e Vestuário", desc: "EPIs, uniformes, calçados e vestimentas funcionais", emoji: "👕" },
  saneamento_meio_ambiente: { label: "Saneamento e Meio Ambiente", desc: "Água, esgoto, resíduos sólidos e serviços ambientais", emoji: "💧" },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return Object.keys(CATEGORIAS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORIAS[slug];
  if (!cat) return {};
  return {
    title: `Licitações de ${cat.label} — Editais Públicos Brasil`,
    description: `${cat.desc}. Pregão eletrônico e concorrência para ${cat.label.toLowerCase()} no PNCP. Alertas grátis no LicitaScanner.`,
    alternates: { canonical: `https://licitascanner.com.br/categoria/${slug}` },
  };
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params;
  const cat = CATEGORIAS[slug];
  if (!cat) notFound();

  const [total, editais, porUf] = await Promise.all([
    prisma.licitacao.count({ where: { cnaePrincipal: slug } }),
    prisma.licitacao.findMany({
      where: { cnaePrincipal: slug },
      orderBy: { dataPublicacao: "desc" },
      take: 24,
      select: { id: true, objeto: true, orgaoNome: true, municipio: true, uf: true, modalidadeNome: true, valorEstimado: true, dataPublicacao: true, situacao: true, fonte: true },
    }),
    prisma.licitacao.groupBy({
      by: ["uf"],
      where: { cnaePrincipal: slug, uf: { not: null } },
      _count: true,
      orderBy: { _count: { uf: "desc" } },
      take: 10,
    }),
  ]);

  const SITE_URL = "https://licitascanner.com.br";
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "LicitaScanner", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Categorias", item: `${SITE_URL}/categoria` },
      { "@type": "ListItem", position: 3, name: cat.label, item: `${SITE_URL}/categoria/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1">
          <Link href="/" className="hover:text-[#0F4C81]">LicitaScanner</Link>
          <span>/</span>
          <span className="text-slate-700 font-medium">{cat.label}</span>
        </nav>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{cat.emoji}</span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Licitações de {cat.label}</h1>
            <p className="text-slate-500 mt-1">{total.toLocaleString("pt-BR")} editais · {cat.desc}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-3">
            {editais.map((l) => (
              <Link
                key={l.id}
                href={`/edital/${licitacaoSlug(l.id)}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0F4C81] hover:shadow-sm transition group"
              >
                <div className="text-[11px] uppercase tracking-wider text-[#0F4C81] font-semibold flex justify-between items-center">
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
                  <span>{l.municipio && l.uf ? `${l.municipio}/${l.uf}` : ""} · {l.orgaoNome?.slice(0, 30)}</span>
                  {l.valorEstimado != null && <span className="font-semibold text-slate-700">{formatBRL(l.valorEstimado)}</span>}
                </div>
              </Link>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold mb-3">Por estado</h2>
              <div className="space-y-1">
                {porUf.map((u) => (
                  <Link
                    key={u.uf}
                    href={`/${(u.uf || "").toLowerCase()}?categoria=${slug}`}
                    className="flex justify-between rounded-lg px-3 py-2 hover:bg-slate-50 text-sm"
                  >
                    <span className="text-slate-700">{u.uf}</span>
                    <span className="text-xs text-[#0F4C81] font-semibold">{u._count}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-[#0F4C81]/5 border border-[#0F4C81]/20 p-5 text-center">
              <p className="font-medium text-sm text-slate-900 mb-1">Alertas de {cat.label}</p>
              <p className="text-xs text-slate-500 mb-3">Receba por e-mail assim que sair novo edital</p>
              <Link
                href="/cadastro"
                className="block bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-4 py-2.5 transition"
              >
                Criar alerta grátis
              </Link>
              <p className="mt-2 text-[10px] text-slate-400">5 alertas grátis para sempre</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
