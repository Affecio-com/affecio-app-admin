import "dotenv/config";
import { buildAdminInviteEmail } from "../src/email/adminInviteEmail";
import { sendEmail } from "../src/email/sendEmail";

async function main() {
  const to = process.argv[2] ?? process.env.TEST_INVITE_EMAIL;
  if (!to) {
    console.error("Usage: npm run email:test-invite -- you@example.com");
    process.exit(1);
  }

  const acceptUrl =
    process.argv[3] ??
    `${(process.env.ADMIN_PORTAL_URL ?? "http://localhost:3000").replace(/\/$/, "")}/invite/sample-token-for-preview`;

  const mail = buildAdminInviteEmail({
    inviteeName: "Aswin Raj",
    inviteeEmail: to,
    inviterName: "Super Admin",
    organizationName: process.env.EMAIL_INVITE_ORG_NAME ?? "Affecio Pvt Ltd",
    projectName: process.env.EMAIL_INVITE_PROJECT_NAME ?? "Affecio Admin Console",
    roleLabel: "admin",
    acceptUrl,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const result = await sendEmail({ to, ...mail });
  console.log(JSON.stringify({ to, sent: result.sent, previewUrl: result.previewUrl }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
