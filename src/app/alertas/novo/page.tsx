import Link from "next/link";
import { UFS } from "@/lib/ufs";
import { CATEGORIAS_META } from "@/lib/categorias";
import { Bell } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Alerta de Licitação",
  description: "Configure alerta por palavra-chave, CNAE ou estado e receba e-mail quando sair novo edital.",
};



export default function NovoAlertaPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <nav className="text-xs text-slate-500 mb-6 flex items-center gap-1">
        <Link href="/" className="hover:text-[#0F4C81]">LicitaScanner</Link>
        <span>/</span>
        <Link href="/alertas" className="hover:text-[#0F4C81]">Alertas</Link>
        <span>/</span>
        <span className="text-slate-700">Novo</span>
      </nav>

      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-xl bg-[#0F4C81]/10 p-3"><Bell className="h-6 w-6 text-[#0F4C81]" /></div>
        <div>
          <h1 className="text-2xl font-semibold">Criar alerta de licitação</h1>
          <p className="text-slate-500 text-sm">Receba e-mail quando sair novo edital para os seus critérios.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <form action="/api/alertas" method="POST">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Palavra-chave <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="term"
                required
                maxLength={120}
                placeholder="Ex: computadores, notebooks, consultoria..."
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 text-sm"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
                <select name="uf" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30">
                  <option value="">Todos os estados</option>
                  {UFS.map((u) => <option key={u.sigla} value={u.sigla}>{u.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
                <select name="cnae" className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30">
                  <option value="">Todas</option>
                  {CATEGORIAS_META.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notificações</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="channel_email" defaultChecked className="w-4 h-4 rounded border-slate-300 accent-[#0F4C81]" />
                  <span className="text-sm text-slate-700">E-mail (grátis)</span>
                </label>
              </div>
            </div>

            <button type="submit" className="w-full h-11 bg-[#0F4C81] hover:bg-[#0a3a66] text-white font-medium rounded-xl transition">
              Criar alerta
            </button>
            <p className="text-center text-xs text-slate-400">
              Você precisa estar <Link href="/cadastro" className="text-[#0F4C81] hover:underline">logado</Link> para salvar.
              5 alertas grátis para sempre · Pro R$ 29,90/mês pra alertas ilimitados.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
