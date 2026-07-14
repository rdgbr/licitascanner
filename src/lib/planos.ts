/**
 * Config central dos planos + stub de "checkout".
 *
 * Sem processador de pagamento ligado ainda: quando alguém quer o plano Pro,
 * gravamos a intenção (PlanIntent) pra não perder o lead e devolvemos um
 * link mailto pré-preenchido pra contato manual. Mesmo padrão do Jurídico
 * Online (src/lib/billing.ts naquele repo) — trocar pelo Stripe real é
 * trabalho futuro, fora de escopo aqui.
 */
import { prisma } from "@/lib/db";

export type PlanId = "free" | "pro";

export const PLANOS: Record<PlanId, { label: string; precoMensal: number; alertasMax: number | null }> = {
  free: { label: "Grátis", precoMensal: 0, alertasMax: 5 },
  pro: { label: "Pro", precoMensal: 29.9, alertasMax: null }, // null = ilimitado
};

export const CONTATO_COMERCIAL = "rodrigodgbr1@gmail.com";

export function formatPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Registra a intenção de assinatura do plano Pro e devolve a URL mailto
 * pra abrir no cliente. Gravação é sempre server-side (chamada de dentro
 * de uma rota de API ou server action) — o componente cliente só abre o
 * link que volta daqui.
 */
export async function criarIntencaoPlano(params: {
  email: string;
  plan: PlanId;
  userId?: string | null;
}): Promise<{ mailtoUrl: string }> {
  const email = params.email.trim().toLowerCase();
  const plan = params.plan;

  if (!email || !email.includes("@")) {
    throw new Error("email inválido");
  }

  try {
    await prisma.planIntent.create({
      data: {
        email,
        plan,
        userId: params.userId || null,
      },
    });
  } catch (e) {
    // Não deixa o usuário travado no fluxo de upgrade por causa de um
    // erro de log — a intenção é best-effort, o mailto sempre abre.
    console.error("[planos] falha ao gravar PlanIntent", e);
  }

  const planoInfo = PLANOS[plan];
  const subject = encodeURIComponent("Quero assinar o plano Pro — LicitaScanner");
  const body = encodeURIComponent(
    `Olá, quero assinar o plano ${planoInfo.label} do LicitaScanner (${formatPreco(planoInfo.precoMensal)}/mês).\n\nMeu e-mail de cadastro: ${email}\n\nAguardo instruções de pagamento.`
  );

  return {
    mailtoUrl: `mailto:${CONTATO_COMERCIAL}?subject=${subject}&body=${body}`,
  };
}
