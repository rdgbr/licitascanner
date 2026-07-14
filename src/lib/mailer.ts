/**
 * Mailgun HTTP API mailer + email templates.
 * No SMTP needed — uses Mailgun's REST API.
 */

const API_KEY = process.env.MAILGUN_API_KEY || "";
const DOMAIN = process.env.MAILGUN_DOMAIN || "mg.juridicoonline.com.br";
const FROM = process.env.MAILGUN_FROM || `LicitaScanner <noreply@${DOMAIN}>`;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://licitascanner.com.br";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "rodrigodgbr1@gmail.com";
const API_URL = `https://api.mailgun.net/v3/${DOMAIN}/messages`;

type SendOpts = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
  /** Set to false to disable Mailgun click-tracking for this email.
   *  Useful for magic-link emails where the tracking domain may lack SSL
   *  and the token is one-time-use anyway (CTR is always 100%). */
  trackClicks?: boolean;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = FROM,
  replyTo,
  tags = [],
  // Default false: the Mailgun click-tracking domain (email.mg.*) has no SSL
  // configured, so wrapped links throw a cert warning in the browser. All
  // current senders are transactional, not marketing, so tracking has no upside.
  trackClicks = false,
}: SendOpts): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!API_KEY) {
    console.warn("[mailer] MAILGUN_API_KEY not set — skipping send", { to, subject });
    return { ok: false, error: "no_api_key" };
  }
  const body = new URLSearchParams();
  body.set("from", from);
  body.set("to", to);
  body.set("subject", subject);
  body.set("html", html);
  if (text) body.set("text", text);
  if (replyTo) body.set("h:Reply-To", replyTo);
  for (const t of tags) body.append("o:tag", t);
  body.set("o:tracking", "yes");
  body.set("o:tracking-clicks", trackClicks ? "yes" : "no");
  body.set("o:tracking-opens", "yes");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`api:${API_KEY}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      console.error("[mailer] error", res.status, json);
      return { ok: false, error: json.message || `HTTP ${res.status}` };
    }
    return { ok: true, id: json.id };
  } catch (e) {
    console.error("[mailer] fetch error", e);
    return { ok: false, error: String(e) };
  }
}

// ─── Email layout ─────────────────────────────────────────────────

function layout(opts: { title: string; preheader?: string; body: string; ctaUrl?: string; ctaLabel?: string }): string {
  const { title, preheader = "", body, ctaUrl, ctaLabel } = opts;
  const year = new Date().getFullYear();
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;line-height:1.5;">
<span style="display:none;font-size:0;line-height:0;color:transparent;opacity:0;">${preheader}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">
      <tr><td align="center" style="padding-bottom:24px;">
        <a href="${SITE}" style="text-decoration:none;font-size:20px;font-weight:600;">
          <span style="color:#0F4C81;">Licita</span><span style="color:#10B981;">Scanner</span>
        </a>
      </td></tr>
      <tr><td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:32px;">
        ${body}
        ${ctaUrl ? `<div style="text-align:center;margin:28px 0 8px;"><a href="${ctaUrl}" style="display:inline-block;background:#0F4C81;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:500;font-size:15px;">${ctaLabel || "Acessar"}</a></div>` : ""}
      </td></tr>
      <tr><td style="padding-top:24px;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
        <p style="margin:0 0 4px;">© ${year} LicitaScanner · ${SITE.replace(/^https?:\/\//, "")}</p>
        <p style="margin:0;">Monitoramento de licitações públicas do Brasil (PNCP).</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─── Templates ─────────────────────────────────────────────────

// O 3º parâmetro (identifier/e-mail do destinatário) é aceito por paridade
// com o call site em auth.ts, mas não é usado no corpo — mantido caso o
// template precise personalizar por destinatário no futuro.
export function magicLinkEmail(url: string, host: string, _recipientEmail?: string): { html: string; text: string; subject: string } {
  const subject = "Seu link de acesso ao LicitaScanner";
  const body = `
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#0f172a;">Entre na sua conta</h1>
    <p style="margin:0 0 4px;color:#475569;">Clique no botão abaixo para entrar no LicitaScanner.</p>
    <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">Link válido por 24 horas. Use apenas uma vez.</p>
    <p style="margin:24px 0 4px;color:#94a3b8;font-size:12px;">Se não funcionar, copie e cole no navegador:</p>
    <p style="margin:0;color:#475569;font-size:12px;word-break:break-all;background:#f1f5f9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;">${url}</p>
    <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;">Se não foi você que solicitou, pode ignorar este e-mail.</p>`;
  const html = layout({ title: subject, preheader: "Confirme seu acesso ao LicitaScanner", body, ctaUrl: url, ctaLabel: "Entrar no LicitaScanner" });
  const text = `Entre na sua conta no LicitaScanner (${host}):\n\n${url}\n\nLink válido por 24h. Se não foi você, ignore.`;
  return { html, text, subject };
}

export function welcomeEmail(name?: string | null): { html: string; text: string; subject: string } {
  const subject = "Bem-vindo(a) ao LicitaScanner \u{1F4E1}";
  const greet = name ? `Olá, ${name.split(" ")[0]}!` : "Olá!";
  const body = `
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:600;">${greet}</h1>
    <p style="margin:0 0 16px;color:#475569;">Sua conta está pronta. Agora você tem acesso liberado a:</p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#475569;">
      <li>Monitoramento de <strong>licitações públicas do Brasil</strong> (PNCP) — federal, estadual e municipal</li>
      <li>Alertas por e-mail quando sair edital pro seu CNAE, UF ou palavra-chave</li>
      <li>Resumo de editais por IA</li>
      <li>90 dias premium sem cartão de crédito</li>
    </ul>
    <p style="margin:0 0 8px;color:#475569;">Começar é simples: crie seu primeiro alerta agora.</p>`;
  const html = layout({ title: subject, preheader: "Sua conta no LicitaScanner está pronta", body, ctaUrl: `${SITE}/alertas/novo`, ctaLabel: "Criar meu primeiro alerta" });
  const text = `${greet}\n\nSua conta no LicitaScanner está pronta.\n\nCrie seu primeiro alerta em ${SITE}/alertas/novo\n\nObrigado por se cadastrar!`;
  return { html, text, subject };
}

export function adminSignupNotification(args: {
  email: string;
  name?: string | null;
}): { html: string; text: string; subject: string } {
  const subject = `\u{1F195} Novo cadastro LicitaScanner: ${args.email}`;
  const body = `
    <h1 style="margin:0 0 12px;font-size:18px;font-weight:600;">Novo cadastro recebido</h1>
    <table cellpadding="6" style="font-size:14px;color:#334155;">
      <tr><td><strong>Email:</strong></td><td>${args.email}</td></tr>
      <tr><td><strong>Nome:</strong></td><td>${args.name || "—"}</td></tr>
      <tr><td><strong>Data:</strong></td><td>${new Date().toLocaleString("pt-BR")}</td></tr>
    </table>`;
  const html = layout({ title: subject, body });
  const text = `Novo cadastro LicitaScanner\n\nEmail: ${args.email}\nNome: ${args.name || "-"}\nData: ${new Date().toLocaleString("pt-BR")}`;
  return { html, text, subject };
}

export async function notifyAdminSignup(args: Parameters<typeof adminSignupNotification>[0]): Promise<void> {
  const tpl = adminSignupNotification(args);
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: ["admin-signup"],
  });
}

export async function sendWelcomeEmail(email: string, name?: string | null): Promise<void> {
  const tpl = welcomeEmail(name);
  await sendEmail({
    to: email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: ["welcome"],
  });
}
