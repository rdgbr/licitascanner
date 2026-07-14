import Stripe from "stripe";

let _stripe: Stripe | null = null;

// Lazy init: Next.js avalia este módulo durante "collecting page data" no
// build (dentro do Docker), estágio que não tem STRIPE_SECRET_KEY (só o
// runtime tem, via docker-compose). Construir o client aqui em cima
// quebraria o build. Instanciar só na primeira chamada real evita isso.
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-06-24.dahlia",
    });
  }
  return _stripe;
}

export const STRIPE_PRICE_ID_PRO = process.env.STRIPE_PRICE_ID_PRO!;
