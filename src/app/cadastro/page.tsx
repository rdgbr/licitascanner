import Link from "next/link";
import { CheckCircle, Shield, Bell, Zap } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/app/login/LoginForm";

export const metadata: Metadata = {
  title: "Criar conta grátis",
  description: "Cadastre-se grátis e monitore licitações públicas do PNCP. Alertas por e-mail, resumo por IA. 5 alertas grátis para sempre.",
};

// Sem AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET no .env, o botão de Google fica
// escondido em vez de aparecer morto em produção (mesmo padrão do auth.ts).
const hasGoogle = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

export default async function CadastroPage() {
  const session = await auth();
  if (session?.user) redirect("/alertas");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#0F4C81]/5 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-2 text-xs bg-[#10B981]/10 text-[#10B981] font-semibold rounded-full px-3 py-1.5">
            <Zap className="h-3.5 w-3.5" /> 5 alertas grátis para sempre · sem cartão
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Criar conta grátis</h1>
          <p className="text-slate-500 text-sm mb-6">Alertas de licitações + resumo IA de editais. Sem cartão.</p>

          {hasGoogle && (
            <>
              <a
                href="/api/auth/signin/google?callbackUrl=/alertas"
                className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition font-medium text-slate-800 shadow-sm"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuar com Google
              </a>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center text-xs text-slate-400 bg-white px-2">ou com e-mail</div>
              </div>
            </>
          )}

          {/* Mesmo fluxo de magic link do /login — no Auth.js "criar conta" e
              "entrar" são a mesma ação: se o e-mail não existir, o Auth.js cria
              o usuário no primeiro clique do link. */}
          <LoginForm nextPath="/alertas" submitLabel="Criar conta grátis" />
        </div>

        <div className="mt-6 grid gap-3">
          {[
            { icon: Bell, text: "Alertas por e-mail de novos editais no seu CNAE" },
            { icon: Shield, text: "IA resume editais — 2x/dia grátis" },
            { icon: CheckCircle, text: "Pro R$ 29,90/mês pra alertas ilimitados, quando quiser" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-slate-600">
              <Icon className="h-4 w-4 text-[#10B981] shrink-0" />{text}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Já tem conta? <Link href="/login" className="text-[#0F4C81] hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
