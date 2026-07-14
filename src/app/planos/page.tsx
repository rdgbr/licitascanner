import Link from "next/link";
import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { auth } from "@/auth";
import { PLANOS, formatPreco } from "@/lib/planos";
import { UpgradeProButton } from "@/components/UpgradeProButton";

export const metadata: Metadata = {
  title: "Planos",
  description: "Compare o plano Grátis e o plano Pro do LicitaScanner. 5 alertas grátis para sempre, ou alertas ilimitados por R$ 29,90/mês.",
  alternates: { canonical: "https://licitascanner.com.br/planos" },
};

export default async function PlanosPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  const linhas: { label: string; free: string | boolean; pro: string | boolean }[] = [
    { label: "Editais do PNCP + diários oficiais municipais", free: true, pro: true },
    { label: "Busca por palavra-chave, UF e categoria", free: true, pro: true },
    { label: "Alertas por e-mail simultâneos", free: `Até ${PLANOS.free.alertasMax}`, pro: "Ilimitados" },
    { label: "Resumo de edital por IA", free: "2x/dia", pro: "Ilimitado" },
    { label: "Filtro por valor estimado (mín/máx)", free: false, pro: true },
    { label: "Suporte", free: "E-mail", pro: "E-mail prioritário" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight">Planos</h1>
        <p className="mt-3 text-slate-500">
          Comece grátis com 5 alertas simultâneos. Quando precisar de mais, o Pro libera
          alertas ilimitados por {formatPreco(PLANOS.pro.precoMensal)}/mês.
        </p>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 gap-6">
        {/* Free */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{PLANOS.free.label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">{formatPreco(0)}</span>
            <span className="text-slate-400 text-sm">/mês</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Para sempre, sem cartão de crédito.</p>
          <Link
            href="/cadastro"
            className="mt-6 block text-center h-11 leading-[44px] rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-medium transition"
          >
            Criar conta grátis
          </Link>
        </div>

        {/* Pro */}
        <div className="rounded-2xl border-2 border-[#0F4C81] bg-[#0F4C81]/5 p-8 relative">
          <span className="absolute -top-3 left-8 bg-[#10B981] text-white text-[11px] font-semibold rounded-full px-3 py-1">
            Alertas ilimitados
          </span>
          <div className="text-sm font-semibold text-[#0F4C81] uppercase tracking-wide">{PLANOS.pro.label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900">{formatPreco(PLANOS.pro.precoMensal)}</span>
            <span className="text-slate-400 text-sm">/mês</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Cobrança manual por enquanto — sem recorrência automática.</p>
          <div className="mt-6">
            <UpgradeProButton
              defaultEmail={userEmail}
              label="Quero o Pro"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg h-11 transition"
            />
          </div>
        </div>
      </div>

      <div className="mt-12 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 font-medium text-slate-500">O que inclui</th>
              <th className="text-center py-3 font-medium text-slate-500 w-32">Grátis</th>
              <th className="text-center py-3 font-medium text-[#0F4C81] w-32">Pro</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.label} className="border-b border-slate-100">
                <td className="py-3 text-slate-700">{l.label}</td>
                <td className="py-3 text-center">
                  <Cell value={l.free} />
                </td>
                <td className="py-3 text-center">
                  <Cell value={l.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Dúvidas sobre o plano Pro? Veja os <Link href="/termos" className="text-[#0F4C81] hover:underline">termos de uso</Link>{" "}
        ou clique em &quot;Quero o Pro&quot; acima — a gente combina o pagamento por e-mail.
      </p>
    </div>
  );
}

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="h-4 w-4 text-[#10B981] mx-auto" />;
  if (value === false) return <Minus className="h-4 w-4 text-slate-300 mx-auto" />;
  return <span className="text-slate-700">{value}</span>;
}
