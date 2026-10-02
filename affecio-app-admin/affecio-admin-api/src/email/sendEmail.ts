import fs from "node:fs";
import nodemailer from "nodemailer";

export type EmailAttachment = {
  filename: string;
  path: string;
  cid?: string;
};

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
};

type SendResult = { sent: boolean; provider: EmailProvider; previewUrl?: string; devLog?: string };

export type EmailProvider = "resend" | "brevo" | "smtp" | "none";

let transporter: nodemailer.Transporter | null = null;

/** Strips quotes and invisible characters that sneak in when pasting into hosting dashboards. */
function cleanEnv(value: string | undefined): string {
  return (value ?? "").replace(/[\u0000-\u0020\u007f-\u00a0\u200b-\u200f\u2028\u2029\ufeff"']/g, "");
}

/** Resend/Brevo use HTTPS, which works on hosts that block outbound SMTP (e.g. Render free tier). */
export function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY?.trim()) return "resend";
  if (process.env.BREVO_API_KEY?.trim()) return "brevo";
  if (process.env.SMTP_HOST?.trim()) return "smtp";
  return "none";
}

export function isEmailConfigured(): boolean {
  return getEmailProvider() !== "none";
}

function fromAddress(): { raw: string; name?: string; email: string } {
  const raw = process.env.EMAIL_FROM?.trim() || "Affecio Admin <no-reply@affecio.com>";
  const match = raw.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (match) return { raw, name: match[1].trim() || undefined, email: match[2].trim() };
  return { raw, email: raw };
}

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const port = Number(cleanEnv(process.env.SMTP_PORT) || 587);
  const secure = cleanEnv(process.env.SMTP_SECURE) === "true" || port === 465;
  const user = cleanEnv(process.env.SMTP_USER);
  const pass = process.env.SMTP_PASS;
  const rejectUnauthorized = cleanEnv(process.env.SMTP_TLS_REJECT_UNAUTHORIZED) !== "false";

  transporter = nodemailer.createTransport({
    host: cleanEnv(process.env.SMTP_HOST),
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    tls: rejectUnauthorized ? undefined : { rejectUnauthorized: false },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email API ${res.status}: ${detail.slice(0, 300)}`);
  }
}

function toBase64Attachments(attachments: EmailAttachment[] = []) {
  return attachments.map((a) => ({
    filename: a.filename,
    content: fs.readFileSync(a.path).toString("base64"),
    cid: a.cid,
  }));
}

export async function sendEmail(input: EmailInput): Promise<SendResult> {
  const provider = getEmailProvider();
  const from = fromAddress();

  if (provider === "resend") {
    await postJson(
      "https://api.resend.com/emails",
      { Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}` },
      {
        from: from.raw,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: toBase64Attachments(input.attachments).map((a) => ({
          filename: a.filename,
          content: a.content,
          content_id: a.cid,
        })),
      },
    );
    return { sent: true, provider };
  }

  if (provider === "brevo") {
    await postJson(
      "https://api.brevo.com/v3/smtp/email",
      { "api-key": process.env.BREVO_API_KEY!.trim() },
      {
        sender: { name: from.name, email: from.email },
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
      },
    );
    return { sent: true, provider };
  }

  if (provider === "smtp") {
    const target = `${JSON.stringify(cleanEnv(process.env.SMTP_HOST))}:${cleanEnv(process.env.SMTP_PORT) || 587}`;
    const info = await getTransporter()
      .sendMail({
        from: from.raw,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments,
      })
      .catch((err: Error & { code?: string }) => {
        const hint =
          err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED" || err.code === "ESOCKET"
            ? " Outbound SMTP is likely blocked by the host (Render free plan blocks 25/465/587) — set BREVO_API_KEY or RESEND_API_KEY instead."
            : "";
        throw new Error(`SMTP ${target} failed: ${err.message}.${hint}`);
      });
    const preview = nodemailer.getTestMessageUrl(info);
    return { sent: true, provider, previewUrl: typeof preview === "string" ? preview : undefined };
  }

  const devLog = `[email:dev] To: ${input.to}\nSubject: ${input.subject}\n${input.text}`;
  console.log(devLog);
  return { sent: false, provider, devLog: input.text };
}
