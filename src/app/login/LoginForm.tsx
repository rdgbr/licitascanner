"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export function LoginForm({ nextPath, submitLabel = "Enviar link de acesso" }: { nextPath?: string; submitLabel?: string }) {
  const [state, formAction] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={nextPath || ""} />

      {state.error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="w-full rounded-lg border border-slate-300 bg-white h-11 px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 focus:border-[#0F4C81]"
        />
      </div>

      <SubmitButton label={submitLabel} />

      <p className="text-center text-xs text-slate-400">
        Vamos enviar um link mágico no seu e-mail. Clique nele e estará dentro.
      </p>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-11 bg-[#0F4C81] hover:bg-[#0a3a66] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition inline-flex items-center justify-center"
    >
      {pending ? (
        <>
          <span className="size-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Enviando...
        </>
      ) : (
        label
      )}
    </button>
  );
}
