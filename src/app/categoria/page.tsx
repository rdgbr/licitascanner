import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Tag, ArrowRight, Search } from "lucide-react";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Licitações por Categoria — Editais de TI, Serviços e Infraestrutura",
  description:
    "Explore licitações públicas do Brasil por categoria: SaaS, CRM, ERP, desenvolvimento de software, marketing digital, hospedagem, suporte de TI e consultoria. Dados PNCP atualizados.",
  alternates: { canonical: "https://licitascanner.com.br/categoria" },
  openGraph: {
    title: "Categorias de Licitações Públicas — LicitaScanner",
    description: "Pregões eletrônicos e concorrências por setor. Alertas grátis por categoria.",
    type: "website",
  },
};

const CATEGORIAS = [
  { slug: "saas", label: "Software como Serviço (SaaS)", desc: "Plataformas SaaS e sistemas em nuvem", emoji: "☁️" },
  { slug: "crm_erp", label: "CRM e ERP", desc: "Sistemas de gestão empresarial", emoji: "🏢" },
  { slug: "desenvolvimento", label: "Desenvolvimento de Software", desc: "Sistemas, aplicações e portais web", emoji: "💻" },
  { slug: "marketing", label: "Marketing Digital", desc: "Redes sociais, comunicação e publicidade", emoji: "📣" },
  { slug: "hospedagem", label: "Hospedagem e Infraestrutura", desc: "Hosting, cloud e data center", emoji: "🖥️" },
  { slug: "suporte", label: "Suporte de TI", desc: "Suporte técnico, manutenção e helpdesk", emoji: "🔧" },
  { slug: "consultoria_ti", label: "Consultoria de TI", desc: "Consultoria tecnológica e gestão de projetos", emoji: "📋" },
  { slug: "api_integracao", label: "APIs e Integrações", desc: "Integração de sistemas e middleware", emoji: "🔗" },
];

async function getCountByCategoria(slug: string): Promise<number> {
  try {
    return await prisma.licitacao.count({ where: { cnaePrincipal: slug } });
  } catch {
    return 0;
  }
}

async function getTotalLicitacoes(): Promise<number> {
  try {
    return await prisma.licitacao.count();
  } catch {
    return 0;
  }
}

export default async function CategoriaIndexPage() {
  const [total, counts] = await Promise.all([
    getTotalLicitacoes(),
    Promise.all(CATEGORIAS.map((c) => getCountByCategoria(c.slug))),
  ]);

  const cats = CATEGORIAS.map((c, i) => ({ ...c, count: counts[i] }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Licitações por Categoria — LicitaScanner",
    description: "Explore editais e pregões públicos do Brasil organizados por categoria e setor.",
    url: "https://licitascanner.com.br/categoria",
    publisher: { "@type": "Organization", name: "LicitaScanner", url: "https://licitascanner.com.br" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <nav className="text-xs text-slate-500 mb-4">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-[#0F4C81]">Início</Link></li>
            <li>/</li>
            <li className="text-slate-700">Categorias</li>
          </ol>
        </nav>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-xl bg-[#10B981]/10 text-[#10B981] p-3">
              <Tag className="h-6 w-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Licitações por Categoria
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl">
            Explore{" "}
            {total > 0 ? (
              <strong>{total.toLocaleString("pt-BR")} editais públicos</strong>
            ) : (
              "editais públicos"
            )}{" "}
            do Brasil organizados por setor e tipo de serviço. Dados oficiais do{" "}
            <strong>Portal Nacional de Contratações Públicas (PNCP)</strong>.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/buscar"
            className="inline-flex items-center gap-2 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-4 h-9 transition"
          >
            <Search className="h-4 w-4" /> Buscar editais
          </Link>
          <Link
            href="/alertas"
            className="inline-flex items-center gap-2 border border-[#0F4C81] text-[#0F4C81] hover:bg-[#0F4C81]/5 text-sm font-medium rounded-lg px-4 h-9 transition"
          >
            Criar alerta por categoria
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cats.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:border-[#10B981]/50 hover:shadow-sm transition group"
            >
              <span className="text-2xl leading-none mt-0.5 shrink-0">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 group-hover:text-[#0F4C81] text-sm">
                  {c.label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{c.desc}</div>
                {c.count > 0 && (
                  <div className="text-[11px] text-[#10B981] font-medium mt-1.5">
                    {c.count.toLocaleString("pt-BR")} edita{c.count !== 1 ? "is" : "l"}
                  </div>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#10B981] mt-0.5 shrink-0" />
            </Link>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-2">
            Sobre as categorias de licitação
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            O LicitaScanner classifica os editais do{" "}
            <strong>Portal Nacional de Contratações Públicas (PNCP)</strong> por setor e tipo de
            serviço. As categorias cobrem as áreas de maior demanda em compras governamentais:
            tecnologia da informação, serviços de TI, desenvolvimento de software e consultoria.
            Para criar alertas e ser notificado de novos editais na sua área,{" "}
            <Link href="/cadastro" className="text-[#0F4C81] hover:underline">
              crie uma conta gratuita
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
