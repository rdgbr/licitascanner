import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Verifique seu e-mail",
  robots: { index: false, follow: false },
};

export default function CheckEmailPage() {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16 text-center">
      <div className="inline-flex">
        <Logo size={32} />
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8">
        <div className="rounded-full bg-[#0F4C81]/10 text-[#0F4C81] p-4 w-fit mx-auto mb-4">
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Verifique seu e-mail
        </h1>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Enviamos um link mágico para o seu e-mail. Clique nele para entrar
          na sua conta. O link é válido por 24 horas.
        </p>

        <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
          <strong className="text-slate-900">Não chegou?</strong> Verifique a pasta de spam
          ou{" "}
          <Link href="/login" className="text-[#0F4C81] hover:underline">
            tente novamente
          </Link>
          .
        </div>
      </div>

      <Link href="/" className="inline-block mt-6 text-sm text-slate-500 hover:text-[#0F4C81]">
        ← Voltar à página inicial
      </Link>
    </div>
  );
}
