import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { UFS } from "@/lib/ufs";
import { CATEGORIAS_KEYWORDS } from "@/lib/categorias";
import { UF_SITEMAP_PAGE_SIZE, EDITAIS_SITEMAP_PAGE_SIZE } from "@/lib/sitemap-config";

export const dynamic = "force-dynamic";
export const revalidate = 21600;

const SITE = "https://licitascanner.com.br";

export async function GET() {
  const now = new Date().toISOString();
  const sitemaps: string[] = [];

  // Static pages
  sitemaps.push(`${SITE}/sitemaps/static`);

  // UF hubs — cada estado referencia sua página 1 e, quando ultrapassa
  // UF_SITEMAP_PAGE_SIZE editais, as páginas seguintes (2..N) também.
  const ufCounts = await prisma.licitacao
    .groupBy({ by: ["uf"], _count: true })
    .catch(() => [] as { uf: string | null; _count: number }[]);
  const countByUf = new Map(ufCounts.map((r) => [r.uf, r._count]));

  for (const u of UFS) {
    const sigla = u.sigla.toLowerCase();
    sitemaps.push(`${SITE}/sitemaps/uf/${sigla}`);
    const totalUf = countByUf.get(u.sigla) || 0;
    const totalUfPages = Math.ceil(totalUf / UF_SITEMAP_PAGE_SIZE);
    for (let p = 2; p <= totalUfPages; p++) {
      sitemaps.push(`${SITE}/sitemaps/uf/${sigla}/${p}`);
    }
  }

  // Categoria hubs — fonte única de verdade: src/lib/categorias.ts (25 categorias)
  const categorias = CATEGORIAS_KEYWORDS.map((c) => c.slug);
  for (const c of categorias) {
    sitemaps.push(`${SITE}/sitemaps/categoria/${c}`);
  }

  // Editais paginados — número de páginas calculado a partir da contagem real
  // na tabela (nunca hardcoded), pra nunca truncar páginas que já existem.
  const totalEditais = await prisma.licitacao.count().catch(() => 0);
  const totalPages = Math.ceil(totalEditais / EDITAIS_SITEMAP_PAGE_SIZE);
  for (let p = 1; p <= totalPages; p++) {
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
