"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";

/**
 * Botão "virar Pro". Grava a intenção (PlanIntent) via POST server-side e
 * abre um mailto pré-preenchido pro contato manual — sem Stripe/gateway
 * ligado ainda (ver src/lib/planos.ts).
 *
 * Se já sabemos o e-mail (usuário logado, passado via prop), o clique é
 * direto. Se não, revela um campo de e-mail inline antes de enviar.
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
  const [email, setEmail] = useState(defaultEmail || "");
  const [asking, setAsking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseClass =
    className ||
    "inline-flex items-center justify-center gap-2 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-5 h-11 transition disabled:opacity-60";

  async function enviar(emailFinal: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/planos/intencao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailFinal, plan: "pro" }),
      });
      const data = await res.json();
      if (!res.ok || !data.mailtoUrl) {
        setError("Não deu pra registrar agora. Tenta de novo?");
        setLoading(false);
        return;
      }
      window.location.href = data.mailtoUrl;
    } catch {
      setError("Não deu pra registrar agora. Tenta de novo?");
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (defaultEmail) {
      enviar(defaultEmail);
      return;
    }
    if (!asking) {
      setAsking(true);
      return;
    }
    if (email.trim().includes("@")) {
      enviar(email.trim());
    } else {
      setError("Digite um e-mail válido.");
    }
  }

  if (asking && !defaultEmail) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="h-11 pl-9 pr-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81]"
          />
        </div>
        <button type="button" onClick={handleClick} disabled={loading} className={baseClass}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Confirmar
        </button>
        {error && <span className="text-xs text-rose-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <button type="button" onClick={handleClick} disabled={loading} className={baseClass}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        {label}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
