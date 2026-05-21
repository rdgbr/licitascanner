import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { UFS } from "@/lib/ufs";
import { licitacaoSlug } from "@/lib/pncp";

export const dynamic = "force-dynamic";
export const revalidate = 21600;

const SITE = "https://licitascanner.com.br";
const PAGE_SIZE = 20_000;

export async function GET() {
  const now = new Date().toISOString();
  const sitemaps: string[] = [];

  // Static pages
  sitemaps.push(`${SITE}/sitemaps/static`);

  // UF hubs
  for (const u of UFS) {
    sitemaps.push(`${SITE}/sitemaps/uf/${u.sigla.toLowerCase()}`);
  }

  // Categoria hubs
  const categorias = ["saas", "crm_erp", "desenvolvimento", "marketing", "hospedagem", "suporte", "consultoria_ti", "api_integracao"];
  for (const c of categorias) {
    sitemaps.push(`${SITE}/sitemaps/categoria/${c}`);
  }

  // Editais paginados
  const totalEditais = await prisma.licitacao.count().catch(() => 0);
  const totalPages = Math.ceil(totalEditais / PAGE_SIZE);
  for (let p = 1; p <= Math.min(totalPages, 10); p++) {
    sitemaps.push(`${SITE}/sitemaps/editais/${p}`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((s) => `  <sitemap><loc>${s}</loc><lastmod>${now}</lastmod></sitemap>`).join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=21600" },
  });
}
