import { CreditCard } from "lucide-react";
import Link from "next/link";

/**
 * Botão "virar Pro". Logado: form POST real pro checkout do Stripe
 * (src/app/api/planos/checkout/route.ts), que redireciona pro checkout
 * hospedado do Stripe. Deslogado: manda logar primeiro, já apontando
 * de volta pra /planos.
 */
export function UpgradeProButton({
  defaultEmail,
  label = "Quero o Pro",
  className,
}: {
  defaultEmail?: string | null;
  label?: string;
  className?: string;
}) {
  const baseClass =
    className ||
    "inline-flex items-center justify-center gap-2 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-5 h-11 transition";

  if (!defaultEmail) {
    return (
      <Link href="/login?next=/planos" className={baseClass}>
        <CreditCard className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <form action="/api/planos/checkout" method="POST">
      <button type="submit" className={baseClass}>
        <CreditCard className="h-4 w-4" />
        {label}
      </button>
    </form>
  );
}
