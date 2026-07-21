import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { licitacaoSlug } from "@/lib/pncp";
import { EDITAIS_SITEMAP_PAGE_SIZE } from "@/lib/sitemap-config";

export const dynamic = "force-dynamic";
const SITE = "https://licitascanner.com.br";

export async function GET(_req: Request, { params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const pageNum = Math.max(1, parseInt(page) || 1);

  const editais = await prisma.licitacao.findMany({
    orderBy: { dataPublicacao: "desc" },
    skip: (pageNum - 1) * EDITAIS_SITEMAP_PAGE_SIZE,
    take: EDITAIS_SITEMAP_PAGE_SIZE,
    select: { id: true, dataPublicacao: true },
  });

  const urls = editais.map((e) => `  <url>
    <loc>${SITE}/edital/${licitacaoSlug(e.id)}</loc>
    <lastmod>${new Date(e.dataPublicacao).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=86400" },
  });
}
