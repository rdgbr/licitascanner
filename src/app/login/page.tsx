import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await auth();
  if (session?.user) redirect(sp.next || "/alertas");

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-16">
      <div className="text-center mb-8">
        <div className="inline-flex">
          <Logo size={32} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-center">
          Entrar
        </h1>
        <p className="text-center text-sm text-slate-500 mt-1">
          Receba um link de acesso no seu e-mail
        </p>

        <LoginForm nextPath={sp.next} />

        <p className="text-center text-xs text-slate-500 mt-5">
          Não tem conta?{" "}
          <Link href={`/cadastro${sp.next ? `?next=${encodeURIComponent(sp.next)}` : ""}`} className="text-[#0F4C81] hover:underline">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
