import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { sendEmail, magicLinkEmail, sendWelcomeEmail, notifyAdminSignup } from "@/lib/mailer";

const hasGoogle = !!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login",
  },
  providers: [
    // Magic link via Mailgun (custom send)
    Nodemailer({
      // server is required by next-auth shape but we override sendVerificationRequest
      server: { host: "stub", port: 587, auth: { user: "stub", pass: "stub" } },
      from: process.env.MAILGUN_FROM,
      maxAge: 24 * 60 * 60, // 24h
      async sendVerificationRequest({ identifier, url }) {
        const host = new URL(url).host;
        // Wrap the original callback URL in our /verify page to avoid Gmail/antivirus
        // pre-fetch consuming the one-shot token. User clicks "Entrar agora" on /verify,
        // which then GETs the real callback URL (with user gesture, so safer).
        const wrappedUrl = `${process.env.NEXT_PUBLIC_SITE_URL || `https://${host}`}/verify?next=${encodeURIComponent(url)}`;
        const tpl = magicLinkEmail(wrappedUrl, host, identifier);
        const r = await sendEmail({
          to: identifier,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
          tags: ["magic-link"],
          // Magic links são tokens de uso único — click tracking não agrega valor
          // e o tracking domain (email.mg.*) não tem SSL, causando erro no browser.
          // Open tracking (pixel) continua funcionando normalmente.
          trackClicks: false,
        });
        if (!r.ok) {
          console.error("[auth] failed to send magic link", r.error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
    ...(hasGoogle
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        (session.user as { id?: string }).id = user.id;
        (session.user as { plan?: string }).plan = (user as { plan?: string }).plan ?? "free";
      }
      return session;
    },
  },
  events: {
    // O schema do LicitaScanner não tem modelo Lead nem campo lastSeenAt em User
    // (diferente do Jurídico Online) — mantemos só o que o schema atual suporta:
    // e-mail de boas-vindas pro usuário e notificação pro admin.
    async createUser({ user }) {
      Promise.allSettled([
        sendWelcomeEmail(user.email!, user.name),
        notifyAdminSignup({
          email: user.email!,
          name: user.name,
        }),
      ]).catch((e) => console.error("[auth] notification error", e));
    },
  },
});
