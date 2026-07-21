import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { licitacaoSlug } from "@/lib/pncp";
import { UFS as UFS_LIST } from "@/lib/ufs";
import { UF_SITEMAP_PAGE_SIZE } from "@/lib/sitemap-config";

export const dynamic = "force-dynamic";
const SITE = "https://licitascanner.com.br";

const UFS = UFS_LIST.map((u) => u.sigla);

// Páginas 2+ do sitemap por UF (a página 1 mora em /sitemaps/uf/[uf]).
// Sem cap fixo: calcula o total real de editais do estado e só serve a
// página se ela existir de fato — nunca trunca, nunca inventa página vazia.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uf: string; page: string }> }
) {
  const { uf, page } = await params;
  const sigla = uf.toUpperCase();

  if (!UFS.includes(sigla)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const pageNum = parseInt(page, 10);
  if (!Number.isFinite(pageNum) || pageNum < 2) {
    return new NextResponse("Not found", { status: 404 });
  }

  const total = await prisma.licitacao.count({ where: { uf: sigla } });
  const totalPages = Math.ceil(total / UF_SITEMAP_PAGE_SIZE);
  if (pageNum > totalPages) {
    return new NextResponse("Not found", { status: 404 });
  }

  const editais = await prisma.licitacao.findMany({
    where: { uf: sigla },
    orderBy: { dataPublicacao: "desc" },
    skip: (pageNum - 1) * UF_SITEMAP_PAGE_SIZE,
    take: UF_SITEMAP_PAGE_SIZE,
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
