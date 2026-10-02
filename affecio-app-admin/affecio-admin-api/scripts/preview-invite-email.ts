import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { buildAdminInviteEmail } from "../src/email/adminInviteEmail";

const outDir = path.join(__dirname, "output");
const outFile = path.join(outDir, "invite-preview.html");

const acceptUrl = `${(process.env.ADMIN_PORTAL_URL ?? "http://localhost:3000").replace(/\/$/, "")}/invite/sample-token-for-preview`;

const mail = buildAdminInviteEmail({
  inviteeName: "Aswin Raj",
  inviteeEmail: "you@example.com",
  inviterName: "Super Admin",
  organizationName: process.env.EMAIL_INVITE_ORG_NAME ?? "Affecio Pvt Ltd",
  projectName: process.env.EMAIL_INVITE_PROJECT_NAME ?? "Affecio Admin Console",
  roleLabel: "admin",
  acceptUrl,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, mail.html, "utf8");
console.log(`Wrote ${outFile}`);
console.log(`Subject: ${mail.subject}`);
