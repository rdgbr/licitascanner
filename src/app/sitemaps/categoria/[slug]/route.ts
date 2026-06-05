import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { licitacaoSlug } from "@/lib/pncp";

export const dynamic = "force-dynamic";
const SITE = "https://licitascanner.com.br";

const SLUGS_VALIDOS = [
  "saas","crm_erp","desenvolvimento","hospedagem","suporte","consultoria_ti","api_integracao","marketing",
  "obras_engenharia","saude","educacao","veiculos_frota","alimentacao","limpeza_conservacao",
  "seguranca_vigilancia","eventos_cultura","mobiliario_equipamentos","material_expediente",
  "energia_eletrica","transporte","publicidade_impressao","combustivel_lubrificantes",
  "hardware_informatica","uniforme_vestuario","saneamento_meio_ambiente",
];

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
