import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://licitascanner.com.br";

export async function POST(_req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.redirect(new URL("/login?next=/planos", SITE), 307);
  }

  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub?.providerCustomerId) {
    return NextResponse.redirect(new URL("/planos", SITE), 307);
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: sub.providerCustomerId,
    return_url: `${SITE}/planos`,
  });

  return NextResponse.redirect(portalSession.url, 303);
}
