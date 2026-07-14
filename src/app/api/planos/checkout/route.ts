import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe, STRIPE_PRICE_ID_PRO } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// Não usar req.url para montar success_url/cancel_url: atrás do proxy
// reverso (Cloudflare + Docker) reflete o host interno do container.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://licitascanner.com.br";

export async function POST(_req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const email = session?.user?.email;

  if (!userId || !email) {
    return NextResponse.redirect(new URL("/login?next=/planos", SITE), 307);
  }

  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing?.status === "active" && !existing.cancelAtPeriodEnd) {
    return NextResponse.redirect(new URL("/planos?already=pro", SITE), 307);
  }

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: STRIPE_PRICE_ID_PRO, quantity: 1 }],
    success_url: `${SITE}/planos?checkout=success`,
    cancel_url: `${SITE}/planos?checkout=cancel`,
    metadata: { userId, plan: "pro" },
    subscription_data: { metadata: { userId, plan: "pro" } },
  });

  if (!checkoutSession.url) {
    return NextResponse.redirect(new URL("/planos?checkout=error", SITE), 307);
  }

  return NextResponse.redirect(checkoutSession.url, 303);
}
