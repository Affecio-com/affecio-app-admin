export type AdminInviteEmailParams = {
  inviteeName: string;
  inviteeEmail: string;
  inviterName: string;
  organizationName: string;
  projectName: string;
  roleLabel: string;
  acceptUrl: string;
  expiresAt: Date;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAdminInviteEmail(params: AdminInviteEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const name = escapeHtml(params.inviteeName);
  const org = escapeHtml(params.organizationName);
  const project = escapeHtml(params.projectName);
  const inviter = escapeHtml(params.inviterName);
  const role = escapeHtml(params.roleLabel);
  const acceptUrl = params.acceptUrl;
  const expires = params.expiresAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const subject = `[Affecio] Invitation to join the project '${params.projectName}'`;

  const text = [
    `Hi ${params.inviteeName},`,
    "",
    `${params.inviterName} from ${params.organizationName} invited you to join ${params.projectName} as ${params.roleLabel}.`,
    "",
    `Accept your invitation: ${acceptUrl}`,
    "",
    `This link expires on ${expires}.`,
    "",
    "— Affecio Admin",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#111111;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;">
              <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">Affecio</div>
              <div style="margin-top:8px;font-size:13px;line-height:1.5;color:#aaaaaa;">Welcome to Affecio Admin — secure operations for your dating platform.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;text-align:center;">
              <h1 style="margin:0;font-size:20px;line-height:1.35;font-weight:600;color:#ffffff;">You have been invited</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;font-size:15px;line-height:1.6;color:#dddddd;">
              <p style="margin:0 0 16px;">Hi ${name},</p>
              <p style="margin:0 0 16px;">
                <strong style="color:#ffffff;">${inviter}</strong> from <strong style="color:#ffffff;">${org}</strong>
                has sent you an invitation to join <strong style="color:#ffffff;">${project}</strong> on Affecio Admin.
              </p>
              <p style="margin:0 0 16px;">
                Your role: <span style="color:#ff4b63;font-weight:600;">${role}</span>
              </p>
              <p style="margin:0;color:#aaaaaa;font-size:14px;">
                Accept the invite to create your password and sign in. This link expires on ${escapeHtml(expires)}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;">
              <a href="${acceptUrl}" style="display:inline-block;background:#ff4b63;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:999px;">
                Accept your invitation
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;text-align:center;font-size:12px;line-height:1.5;color:#888888;">
              <p style="margin:0;">If the button does not work, copy this link into your browser:</p>
              <p style="margin:8px 0 0;word-break:break-all;"><a href="${acceptUrl}" style="color:#ff4b63;">${acceptUrl}</a></p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center;font-size:12px;color:#666666;">
              The Affecio Team · Admin access is role-based and audited
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
