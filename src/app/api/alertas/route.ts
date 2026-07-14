import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PLANOS } from "@/lib/planos";

// Não usar req.url para montar o destino do redirect: atrás do proxy reverso
// (Cloudflare + Docker), req.url reflete o host interno do container
// (0.0.0.0:3000), não o domínio público. Mesmo padrão de SITE usado nas
// rotas de sitemap deste projeto.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://licitascanner.com.br";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.redirect(new URL("/login?next=/alertas/novo", SITE), 307);
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const alertasMax = user?.plan === "pro" ? PLANOS.pro.alertasMax : PLANOS.free.alertasMax;
  if (alertasMax !== null) {
    const alertasCount = await prisma.alertaLicitacao.count({ where: { userId } });
    if (alertasCount >= alertasMax) {
      return NextResponse.redirect(new URL("/alertas?limit=true", SITE), 307);
    }
  }

  const form = await req.formData();
  const term = String(form.get("term") || "").trim();
  const uf = String(form.get("uf") || "").trim();
  const cnae = String(form.get("cnae") || "").trim();
  const channelEmail = form.get("channel_email");

  if (!term) {
    return NextResponse.redirect(new URL("/alertas/novo?error=term_required", SITE), 307);
  }

  await prisma.alertaLicitacao.create({
    data: {
      userId,
      term,
      uf: uf || null,
      cnaeFilter: cnae || null,
      channels: channelEmail ? ["email"] : [],
    },
  });

  return NextResponse.redirect(new URL("/alertas", SITE), 307);
}
