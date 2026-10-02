import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false";

  transporter = nodemailer.createTransport({
    host,
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

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
}

export type EmailAttachment = {
  filename: string;
  path: string;
  cid?: string;
};

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}): Promise<{ sent: boolean; previewUrl?: string; devLog?: string }> {
  const from = process.env.EMAIL_FROM?.trim() ?? "Affecio Admin <no-reply@affecio.com>";
  const transport = getTransporter();

  if (!transport) {
    const devLog = `[email:dev] To: ${input.to}\nSubject: ${input.subject}\n${input.text}`;
    console.log(devLog);
    return { sent: false, devLog: input.text };
  }

  const info = await transport.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    attachments: input.attachments,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  const previewUrl = typeof preview === "string" ? preview : undefined;
  return { sent: true, previewUrl };
}
