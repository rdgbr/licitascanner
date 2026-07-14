import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { licitacaoSlug } from "@/lib/pncp";
import { UFS as UFS_LIST } from "@/lib/ufs";

export const dynamic = "force-dynamic";
const SITE = "https://licitascanner.com.br";

const UFS = UFS_LIST.map((u) => u.sigla);

export async function GET(_req: Request, { params }: { params: Promise<{ uf: string }> }) {
  const { uf } = await params;
  const sigla = uf.toUpperCase();

  if (!UFS.includes(sigla)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const editais = await prisma.licitacao.findMany({
    where: { uf: sigla },
    orderBy: { dataPublicacao: "desc" },
    take: 5000,
    select: { id: true, dataPublicacao: true },
  });

  const hub = `  <url><loc>${SITE}/${uf.toLowerCase()}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`;
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
