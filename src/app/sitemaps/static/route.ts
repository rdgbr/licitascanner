import { NextResponse } from "next/server";
import { UFS } from "@/lib/ufs";

const SITE = "https://licitascanner.com.br";
const CATEGORIAS = ["saas", "crm_erp", "desenvolvimento", "marketing", "hospedagem", "suporte", "consultoria_ti", "api_integracao"];

export function GET() {
  const today = new Date().toISOString().split("T")[0];
  const urls: string[] = [
    `<url><loc>${SITE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${SITE}/buscar</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${SITE}/categoria</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${SITE}/cadastro</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    `<url><loc>${SITE}/planos</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    `<url><loc>${SITE}/sobre</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
    `<url><loc>${SITE}/termos</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>`,
    `<url><loc>${SITE}/privacidade</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>`,
    ...UFS.map((u) => `<url><loc>${SITE}/${u.sigla.toLowerCase()}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`),
    ...CATEGORIAS.map((c) => `<url><loc>${SITE}/categoria/${c}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=86400" },
  });
}
