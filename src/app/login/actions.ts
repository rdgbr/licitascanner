"use server";

import { signIn } from "@/auth";
import { z } from "zod";

const schema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  next: z.string().optional().nullable(),
});

export type LoginState = { error?: string; ok?: boolean };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") || "").trim().toLowerCase(),
    next: String(formData.get("next") || "") || null,
  });
  if (!parsed.success) {
    return { error: "E-mail inválido. Verifique e tente novamente." };
  }

  await signIn("nodemailer", {
    email: parsed.data.email,
    redirectTo:
      parsed.data.next && parsed.data.next.startsWith("/") && !parsed.data.next.startsWith("//")
        ? parsed.data.next
        : "/alertas",
  });
  return { ok: true };
}
