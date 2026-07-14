import Link from "next/link";
import { Bell, Plus, Search, Mail, Pause } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PLANOS, formatPreco } from "@/lib/planos";
import { UpgradeProButton } from "@/components/UpgradeProButton";

export const metadata: Metadata = {
  title: "Meus Alertas de Licitações",
  description: "Gerencie seus alertas. Receba e-mail quando aparecer licitação para seu CNAE, cidade ou palavra-chave.",
};

export default async function AlertasPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const userEmail = session?.user?.email;

  const alertas = userId
    ? await prisma.alertaLicitacao.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const limiteFree = PLANOS.free.alertasMax ?? 5;
  const noLimite = userId && alertas.length >= limiteFree;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meus Alertas</h1>
          <p className="text-slate-500 mt-1 text-sm">Palavras-chave, CNAE, UF ou órgão que você quer monitorar.</p>
        </div>
        <Link
          href="/alertas/novo"
          className="inline-flex items-center gap-2 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-4 h-10 transition"
        >
          <Plus className="h-4 w-4" /> Novo alerta
        </Link>
      </div>

      {alertas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#0F4C81]/30 bg-[#0F4C81]/5 p-10 text-center">
          <Bell className="h-10 w-10 text-[#0F4C81] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900">Nenhum alerta ainda</h2>
          <p className="mt-2 text-slate-500 text-sm max-w-sm mx-auto">
            Configure alertas por palavra-chave, CNAE, estado ou órgão. Receba e-mail assim que sair novo edital.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/alertas/novo"
              className="inline-flex items-center justify-center gap-2 bg-[#0F4C81] hover:bg-[#0a3a66] text-white text-sm font-medium rounded-lg px-5 h-11 transition"
            >
              <Plus className="h-4 w-4" /> Criar primeiro alerta
            </Link>
            <Link
              href="/buscar"
              className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg px-5 h-11 transition"
            >
              <Search className="h-4 w-4" /> Buscar editais
            </Link>
          </div>
          {!userId && (
            <p className="mt-4 text-xs text-slate-400">
              <Link href="/cadastro" className="text-[#0F4C81] hover:underline font-medium">Crie conta grátis</Link>{" "}
              · 5 alertas grátis para sempre · Pro {formatPreco(PLANOS.pro.precoMensal)}/mês pra alertas ilimitados
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium text-slate-900 truncate">{a.term}</div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{a.uf ? `UF: ${a.uf}` : "Todos os estados"}</span>
                  {a.cnaeFilter && <span>Categoria: {a.cnaeFilter}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {a.channels.length ? a.channels.join(", ") : "sem canal ativo"}
                  </span>
                </div>
              </div>
              <span
                className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${
                  a.active ? "bg-[#10B981]/10 text-[#10B981]" : "bg-slate-100 text-slate-500"
                }`}
              >
                {a.active ? "Ativo" : <><Pause className="h-3 w-3" /> Pausado</>}
              </span>
            </div>
          ))}
        </div>
      )}

      {noLimite && (
        <div className="mt-6 rounded-2xl border border-[#10B981]/30 bg-[#10B981]/5 p-6 text-center">
          <h2 className="text-base font-semibold text-slate-900">
            Você atingiu o limite de {limiteFree} alertas do plano grátis
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">
            No plano Pro ({formatPreco(PLANOS.pro.precoMensal)}/mês) os alertas são ilimitados.
          </p>
          <div className="mt-4 flex justify-center">
            <UpgradeProButton defaultEmail={userEmail} />
          </div>
        </div>
      )}

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        {[
          { title: "Alertas grátis", value: String(limiteFree), desc: "alertas simultâneos no plano gratuito" },
          { title: "Alertas Pro", value: "∞", desc: `alertas ilimitados por ${formatPreco(PLANOS.pro.precoMensal)}/mês` },
          { title: "Editais monitorados", value: "40k+", desc: "editais PNCP atualizados diariamente" },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-[#0F4C81]">{c.value}</div>
            <div className="text-xs font-medium text-slate-700 mt-1">{c.title}</div>
            <div className="text-xs text-slate-400 mt-1">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
