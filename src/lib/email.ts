import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || "Painel de Demandas <onboarding@resend.dev>";

/**
 * Envia um e-mail via Resend. Se RESEND_API_KEY não estiver configurada,
 * a função apenas registra no console e não quebra o fluxo do app.
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!apiKey) {
    console.log("[email] RESEND_API_KEY ausente — e-mail não enviado:", params.subject);
    return { skipped: true };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to: params.to, subject: params.subject, html: params.html });
    return { ok: true };
  } catch (error) {
    // Nunca deixar o envio de e-mail derrubar a operação principal.
    console.error("[email] Falha ao enviar:", error);
    return { ok: false, error };
  }
}

/** Modelo de e-mail simples e responsivo. */
export function emailTemplate(opts: {
  titulo: string;
  linhas: string[];
  ctaUrl?: string;
  ctaLabel?: string;
}) {
  const corpo = opts.linhas.map((l) => `<p style="margin:0 0 8px">${l}</p>`).join("");
  const cta = opts.ctaUrl
    ? `<a href="${opts.ctaUrl}" style="display:inline-block;margin-top:16px;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">${opts.ctaLabel || "Abrir painel"}</a>`
    : "";

  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#0f172a">
    <h2 style="margin:0 0 16px;color:#1d4ed8">${opts.titulo}</h2>
    ${corpo}
    ${cta}
    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0" />
    <p style="font-size:12px;color:#64748b">Mensagem automática do Painel de Demandas.</p>
  </div>`;
}
