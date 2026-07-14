import Link from "next/link";
import { prisma } from "@/lib/db";
import { UFS } from "@/lib/ufs";
import { formatBRL, licitacaoSlug } from "@/lib/pncp";
import { Search, MapPin, ArrowRight, Zap, Bell, Database, TrendingUp } from "lucide-react";

export const revalidate = 300;

export default async function Home() {
  const [todayCount, weekTotal, recent, byUf] = await Promise.all([
    prisma.licitacao.count({
      where: { dataPublicacao: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.licitacao.aggregate({
      where: {
        dataPublicacao: { gte: new Date(Date.now() - 7 * 86400000) },
        valorEstimado: { not: null },
      },
      _sum: { valorEstimado: true },
    }),
    prisma.licitacao.findMany({
      orderBy: { dataPublicacao: "desc" },
      take: 12,
      where: { situacao: { not: "Encerrada" } },
    }),
    prisma.licitacao.groupBy({
      by: ["uf"],
      _count: true,
      where: { dataPublicacao: { gte: new Date(Date.now() - 7 * 86400000) } },
      orderBy: { _count: { uf: "desc" } },
      take: 8,
    }),
  ]).catch(() => [0, { _sum: { valorEstimado: 0 } }, [], []] as const);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0F4C81] to-[#0a3a66] text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
          <div className="inline-flex items-center gap-2 text-xs bg-white/15 rounded-full px-3 py-1.5 mb-4 text-white/90">
            <span className="text-[#10B981] font-bold">Grátis</span> · Mensal cancelável · IA inclusa
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Monitore <span className="text-[#10B981]">licitações públicas</span> em tempo real
          </h1>
          <p className="mt-4 text-white/85 max-w-2xl">
            Todos os editais do PNCP — federal, estadual, municipal.
            Alertas por e-mail, <strong className="text-white">resumo por IA</strong> e análise de edital.
            <span className="underline decoration-dotted"> 5 alertas grátis para sempre</span>.
            Pro R$ 29,90/mês pra alertas ilimitados.
          </p>

          <form action="/buscar" method="GET" className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="search"
                name="q"
                placeholder="Ex: computadores em São Paulo, obras Florianópolis..."
                required
                minLength={3}
                className="w-full h-14 pl-12 pr-4 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#10B981]/30 text-sm sm:text-base"
              />
            </div>
          </form>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl">
            <Stat label="Editais hoje" value={todayCount.toLocaleString("pt-BR")} icon={<Zap className="h-4 w-4" />} />
            <Stat
              label="Movimentado (7d)"
              value={weekTotal._sum?.valorEstimado ? formatBRL(weekTotal._sum.valorEstimado) : "—"}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <Stat label="Estados cobertos" value="27" icon={<MapPin className="h-4 w-4" />} />
          </div>
        </div>
      </section>

      {/* Empty-state vs recent */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Database className="h-8 w-8 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-900">Importando dados PNCP…</h2>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              Estamos populando a base agora. Volte em alguns minutos. Enquanto isso,
              explore as fontes oficiais em{" "}
              <a href="https://pncp.gov.br" target="_blank" rel="noopener" className="text-[#0F4C81] underline">
                pncp.gov.br
              </a>
              .
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold tracking-tight mb-4">Editais recentes</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {recent.map((l) => (
                <Link
                  key={l.id}
                  href={`/edital/${licitacaoSlug(l.id)}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0F4C81] hover:shadow-sm transition group"
                >
                  <div className="text-[11px] uppercase tracking-wider text-[#0F4C81] font-semibold">
                    {l.modalidadeNome}
                  </div>
                  <div className="mt-1 font-medium text-slate-900 line-clamp-2 group-hover:text-[#0F4C81]">
                    {l.objeto}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 line-clamp-1">{l.orgaoNome}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {l.municipio && `${l.municipio}/${l.uf}`}
                    </span>
                    {l.valorEstimado && (
                      <span className="font-semibold text-slate-700">
                        {formatBRL(l.valorEstimado)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      {/* By UF */}
      {byUf.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <h2 className="text-xl font-semibold mb-4">Por estado (últimos 7 dias)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {byUf.map((u) => (
              <Link
                key={u.uf}
                href={`/${(u.uf || "").toLowerCase()}`}
                className="rounded-lg border border-slate-200 bg-white p-3 hover:border-[#0F4C81] transition flex items-center justify-between"
              >
                <span className="text-sm text-slate-700">{u.uf}</span>
                <span className="text-xs text-[#0F4C81] font-semibold">{u._count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All UFs */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <h2 className="text-xl font-semibold mb-4">Explore por estado</h2>
        <div className="flex flex-wrap gap-2">
          {UFS.map((u) => (
            <Link
              key={u.sigla}
              href={`/${u.sigla.toLowerCase()}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-[#0F4C81] hover:text-[#0F4C81]"
            >
              {u.nome}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Alerts */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-gradient-to-br from-[#10B981]/10 to-[#0F4C81]/10 border border-[#0F4C81]/20 p-8 sm:p-12 text-center">
          <Bell className="h-10 w-10 text-[#0F4C81] mx-auto mb-3" />
          <h2 className="text-2xl font-semibold tracking-tight">Não perca nenhuma oportunidade</h2>
          <p className="mt-2 text-slate-600 max-w-md mx-auto">
            Crie alertas grátis e receba e-mail toda vez que aparecer licitação
            que combine com sua empresa.
          </p>
          <Link
            href="/cadastro"
            className="mt-6 inline-flex items-center gap-2 bg-[#0F4C81] hover:bg-[#0a3a66] text-white font-medium rounded-lg px-6 h-11 transition"
          >
            Criar conta grátis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur p-3 border border-white/20">
      <div className="text-white/70">{icon}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
      <div className="text-[11px] text-white/70">{label}</div>
    </div>
  );
}
