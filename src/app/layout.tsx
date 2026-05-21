import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Search, Bell } from "lucide-react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://licitascanner.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LicitaScanner — Monitore licitações públicas em tempo real",
    template: "%s | LicitaScanner",
  },
  description:
    "Acompanhe todas as licitações públicas do Brasil (PNCP) — federal, estadual e municipal. Alertas grátis por palavra-chave, CNAE ou cidade. Dados oficiais.",
  keywords: [
    "licitações", "PNCP", "pregão eletrônico", "compras públicas", "editais",
    "licitação SP", "licitação RJ", "Lei 14.133", "ComprasGov",
  ],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "LicitaScanner",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#0F4C81",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: SITE_URL,
                  name: "LicitaScanner",
                  description:
                    "Monitore licitações públicas do Brasil (PNCP) — alertas por palavra-chave, CNAE ou cidade.",
                  inLanguage: "pt-BR",
                  publisher: { "@id": `${SITE_URL}/#org` },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/buscar?q={search_term_string}` },
                    "query-input": "required name=search_term_string",
                  },
                },
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#org`,
                  name: "LicitaScanner",
                  url: SITE_URL,
                  logo: `${SITE_URL}/logo.png`,
                  sameAs: [
                    "https://juridicoonline.com.br",
                    "https://juridicoempauta.com.br",
                  ],
                },
              ],
            }),
          }}
        />

        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/85 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="size-7 rounded-lg bg-[#0F4C81] text-white inline-flex items-center justify-center">
                <Search className="h-4 w-4" />
              </span>
              <span className="font-semibold tracking-tight">
                <span className="text-[#0F4C81]">Licita</span>
                <span className="text-[#10B981]">Scanner</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-sm text-slate-600">
              <Link href="/" className="hover:text-[#0F4C81]">Hoje</Link>
              <Link href="/buscar" className="hover:text-[#0F4C81]">Buscar</Link>
              <Link href="/categoria" className="hover:text-[#0F4C81]">Categorias</Link>
              <Link href="/alertas" className="hover:text-[#0F4C81] inline-flex items-center gap-1">
                <Bell className="h-3.5 w-3.5" /> Alertas
              </Link>
              <Link href="/api" className="hover:text-[#0F4C81]">API</Link>
            </nav>
            <Link
              href="/cadastro"
              className="text-sm bg-[#0F4C81] hover:bg-[#0a3a66] text-white rounded-lg px-3.5 py-2 font-medium"
            >
              Cadastre-se
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-slate-50 mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="font-semibold text-slate-800 mb-3">LicitaScanner</div>
                <p className="text-xs text-slate-500 mb-3">Monitore licitações públicas do Brasil (PNCP) — federal, estadual e municipal. Alertas grátis por palavra-chave, CNAE ou cidade.</p>
                <p className="text-xs text-slate-400">Dados oficiais PNCP · Lei 14.133/2021</p>
              </div>
              <div>
                <div className="font-semibold text-slate-700 mb-3 text-xs uppercase tracking-wide">Navegar</div>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li><Link href="/buscar" className="hover:text-[#0F4C81]">Buscar licitações</Link></li>
                  <li><Link href="/categoria" className="hover:text-[#0F4C81]">Por categoria</Link></li>
                  <li><Link href="/alertas" className="hover:text-[#0F4C81]">Criar alerta</Link></li>
                  <li><Link href="/cadastro" className="hover:text-[#0F4C81]">Criar conta gratuita</Link></li>
                </ul>
              </div>
              <div>
                <div className="font-semibold text-slate-700 mb-3 text-xs uppercase tracking-wide">Rede Jurídico</div>
                <div className="space-y-2.5">
                  <a href="https://juridicoonline.com.br" className="flex items-start gap-2 group">
                    <span className="size-6 rounded bg-[#0F4C81]/10 text-[#0F4C81] inline-flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">JO</span>
                    <div>
                      <div className="text-xs font-medium text-slate-700 group-hover:text-[#0F4C81]">Jurídico Online</div>
                      <div className="text-[11px] text-slate-400">Consulte dados de empresas participantes das licitações — CNPJ, sócios e contatos.</div>
                    </div>
                  </a>
                  <a href="https://juridicoempauta.com.br" className="flex items-start gap-2 group">
                    <span className="size-6 rounded bg-[#10B981]/10 text-[#10B981] inline-flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">JP</span>
                    <div>
                      <div className="text-xs font-medium text-slate-700 group-hover:text-[#0F4C81]">Jurídico em Pauta</div>
                      <div className="text-[11px] text-slate-400">Acompanhe atos oficiais dos órgãos contratantes — portarias, nomeações e contratos.</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap justify-between gap-2 text-[11px] text-slate-400">
              <span>© {new Date().getFullYear()} LicitaScanner — Todos os direitos reservados</span>
              <span>Dados públicos PNCP · Atualização diária</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
