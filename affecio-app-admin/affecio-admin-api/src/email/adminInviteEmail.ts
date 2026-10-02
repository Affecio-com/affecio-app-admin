import path from "node:path";
import { getEmailProvider, type EmailAttachment } from "./sendEmail";

export type AdminInviteEmailParams = {
  inviteeName: string;
  inviteeEmail: string;
  inviterName: string;
  organizationName: string;
  projectName: string;
  roleLabel: string;
  acceptUrl: string;
  expiresAt: Date;
  /** Overrides the logo image src (e.g. a file:// URL for local previews). */
  logoSrc?: string;
};

const LOGO_CID = "affecio-logo";
export const AFFECIO_LOGO_PATH = path.resolve(__dirname, "../../assets/affecio-logo.png");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatRole(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildAdminInviteEmail(params: AdminInviteEmailParams): {
  subject: string;
  html: string;
  text: string;
  attachments: EmailAttachment[];
} {
  const firstName = params.inviteeName.trim().split(/\s+/)[0] || "there";
  const name = escapeHtml(firstName);
  const org = escapeHtml(params.organizationName);
  const project = escapeHtml(params.projectName);
  const inviter = escapeHtml(params.inviterName);
  const role = escapeHtml(formatRole(params.roleLabel));
  const acceptUrl = params.acceptUrl;
  const expires = params.expiresAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const portalUrl = (process.env.ADMIN_PORTAL_URL ?? "").trim().replace(/\/$/, "");
  const hostedLogoUrl =
    process.env.EMAIL_LOGO_URL?.trim() ||
    (getEmailProvider() === "brevo" && portalUrl ? `${portalUrl}/icon.png` : undefined);
  const logoSrc = params.logoSrc ?? hostedLogoUrl ?? `cid:${LOGO_CID}`;
  const attachments: EmailAttachment[] =
    logoSrc === `cid:${LOGO_CID}`
      ? [{ filename: "affecio-logo.png", path: AFFECIO_LOGO_PATH, cid: LOGO_CID }]
      : [];

  const subject = `You're in ✨ Join the ${params.projectName} crew`;

  const text = [
    `Hey ${firstName} 👋`,
    "",
    `${params.inviterName} at ${params.organizationName} just added you to ${params.projectName} — the control room that keeps Affecio safe, smooth, and lowkey iconic.`,
    "",
    `Your role: ${formatRole(params.roleLabel)}`,
    "",
    "What's next? Tap the link, set a password, and you're in. Takes like 30 seconds.",
    "",
    `Accept your invite: ${acceptUrl}`,
    "",
    `Heads up: this link expires on ${expires}.`,
    "",
    "Didn't expect this? No stress — just ignore this email and nothing happens.",
    "",
    "— The Affecio Team 💖",
  ].join("\n");

  const perk = (emoji: string, title: string, body: string) => `
                <tr>
                  <td width="40" valign="top" style="padding:0 0 14px;font-size:20px;line-height:1;">${emoji}</td>
                  <td valign="top" style="padding:0 0 14px;font-size:14px;line-height:1.5;color:#cfcfcf;">
                    <strong style="color:#ffffff;">${title}</strong><br />${body}
                  </td>
                </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${inviter} added you to ${project}. Set your password and you're in 🚀</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#111111;border:1px solid #2a2a2a;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="height:4px;background:#ff4b63;background-image:linear-gradient(90deg,#ff4b63,#ff8a5c,#b44bff);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 32px 0;text-align:center;">
              <img src="${logoSrc}" width="72" height="72" alt="Affecio" style="display:block;margin:0 auto;width:72px;height:72px;border:0;border-radius:18px;background:#000000;" />
              <div style="margin-top:12px;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">Affecio</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;text-align:center;">
              <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#2a1418;color:#ff7a8c;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">New squad unlocked</span>
              <h1 style="margin:16px 0 0;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">You've been invited. No cap. 💌</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;font-size:15px;line-height:1.65;color:#dddddd;">
              <p style="margin:0 0 16px;">Hey ${name} 👋</p>
              <p style="margin:0 0 20px;">
                <strong style="color:#ffffff;">${inviter}</strong> at <strong style="color:#ffffff;">${org}</strong>
                just added you to <strong style="color:#ffffff;">${project}</strong> — the control room that keeps
                Affecio safe, smooth, and lowkey iconic.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#181818;border:1px solid #2a2a2a;border-radius:14px;">
                <tr>
                  <td style="padding:14px 18px;font-size:13px;color:#aaaaaa;">Your role</td>
                  <td align="right" style="padding:14px 18px;font-size:14px;font-weight:700;color:#ff4b63;">${role} ⚡</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 0;">
              <div style="margin:0 0 14px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#888888;">What you're about to do</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${perk("🛡️", "Keep the vibes safe", "Moderate, review reports, and protect the community.")}${perk("📊", "See the real numbers", "Live insights on users, matches, and growth.")}${perk("🚀", "Make moves, fast", "Ship decisions in clicks, not endless threads.")}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0;text-align:center;">
              <a href="${acceptUrl}" style="display:inline-block;background:#ff4b63;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 36px;border-radius:999px;">
                Let's go — accept invite 🚀
              </a>
              <p style="margin:14px 0 0;font-size:13px;color:#aaaaaa;">Takes like 30 seconds: set a password and you're in.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;text-align:center;font-size:13px;color:#cfcfcf;">
              ⏳ Heads up: this link expires on <strong style="color:#ffffff;">${escapeHtml(expires)}</strong>.
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;text-align:center;font-size:12px;line-height:1.5;color:#888888;">
              <p style="margin:0;">Button acting up? Copy this link into your browser:</p>
              <p style="margin:8px 0 0;word-break:break-all;"><a href="${acceptUrl}" style="color:#ff4b63;">${acceptUrl}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center;font-size:12px;line-height:1.6;color:#666666;">
              Didn't expect this? No stress — just ignore it and nothing happens.<br />
              Made with 💖 by the Affecio Team · Admin access is role-based &amp; audited
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text, attachments };
}
