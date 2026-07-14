import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function upsertSubscriptionFromStripe(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) {
    console.error("[webhook stripe] subscription sem metadata.userId", sub.id);
    return;
  }

  const item = sub.items.data[0];
  const plan = (sub.metadata?.plan as string) || "pro";

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: sub.status,
        providerCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        providerSubscriptionId: sub.id,
        currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
        currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
      update: {
        plan,
        status: sub.status,
        providerCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        providerSubscriptionId: sub.id,
        currentPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
        currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: sub.status === "active" || sub.status === "trialing" ? plan : "free" },
    }),
  ]);
}

async function downgradeToFree(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;

  await prisma.$transaction([
    prisma.subscription.updateMany({
      where: { userId, providerSubscriptionId: sub.id },
      data: { status: "canceled", cancelAtPeriodEnd: false },
    }),
    prisma.user.update({ where: { id: userId }, data: { plan: "free" } }),
  ]);
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook stripe] assinatura inválida", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  // Idempotência: grava o eventId antes de processar. Se já existir
  // (retry do Stripe pro mesmo evento), pula o processamento mas ainda
  // responde 200 — senão o Stripe reenvia pra sempre.
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        payload: event as unknown as object,
        processed: false,
      },
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const sub = await getStripe().subscriptions.retrieve(subId);
          await upsertSubscriptionFromStripe(sub);
        }
        break;
      }
      case "customer.subscription.updated": {
        await upsertSubscriptionFromStripe(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await downgradeToFree(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subField = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
        const subId = typeof subField === "string" ? subField : subField?.id;
        if (subId) {
          const sub = await getStripe().subscriptions.retrieve(subId);
          await upsertSubscriptionFromStripe(sub);
        }
        break;
      }
      default:
        break;
    }

    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (err) {
    console.error("[webhook stripe] erro ao processar evento", event.type, err);
    await prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { error: String(err) },
    }).catch(() => {});
    return NextResponse.json({ received: true, processError: true });
  }

  return NextResponse.json({ received: true });
}
