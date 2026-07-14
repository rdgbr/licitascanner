import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { licitacaoSlug } from "@/lib/pncp";
import { CATEGORIAS_KEYWORDS } from "@/lib/categorias";

export const dynamic = "force-dynamic";
const SITE = "https://licitascanner.com.br";

// Fonte única de verdade: src/lib/categorias.ts (25 categorias)
const SLUGS_VALIDOS = CATEGORIAS_KEYWORDS.map((c) => c.slug);

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!SLUGS_VALIDOS.includes(slug)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const editais = await prisma.licitacao.findMany({
    where: { cnaePrincipal: slug },
    orderBy: { dataPublicacao: "desc" },
    take: 5000,
    select: { id: true, dataPublicacao: true },
  });

  const hub = `  <url><loc>${SITE}/categoria/${slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`;
  const urls = [
    hub,
    ...editais.map((e) => `  <url>
    <loc>${SITE}/edital/${licitacaoSlug(e.id)}</loc>
    <lastmod>${new Date(e.dataPublicacao).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=86400" },
  });
}
