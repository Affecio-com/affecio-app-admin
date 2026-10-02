import crypto from "node:crypto";
import type { AdminRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { generateInviteToken, hashInviteToken } from "../lib/inviteToken";
import { hashPassword } from "../lib/password";
import { buildAdminInviteEmail } from "../email/adminInviteEmail";
import { getEmailProvider, sendEmail } from "../email/sendEmail";

const INVITE_TTL_MS = (Number(process.env.INVITE_TTL_DAYS ?? 7) || 7) * 24 * 60 * 60 * 1000;

const inviteSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  expiresAt: true,
  createdAt: true,
} as const;

function roleLabel(role: AdminRole): string {
  return role.replace(/_/g, " ");
}

function portalBaseUrl(): string {
  return (process.env.ADMIN_PORTAL_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function listPendingInvites() {
  return prisma.adminInvite.findMany({
    where: { acceptedAt: null },
    select: {
      ...inviteSelect,
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function deliverInvite(invite: { email: string; name: string; role: AdminRole; expiresAt: Date }, rawToken: string, inviterName: string) {
  const acceptUrl = `${portalBaseUrl()}/invite/${rawToken}`;
  const mail = buildAdminInviteEmail({
    inviteeName: invite.name,
    inviteeEmail: invite.email,
    inviterName,
    organizationName: process.env.EMAIL_INVITE_ORG_NAME ?? "Affecio Pvt Ltd",
    projectName: process.env.EMAIL_INVITE_PROJECT_NAME ?? "Affecio Admin Console",
    roleLabel: roleLabel(invite.role),
    acceptUrl,
    expiresAt: invite.expiresAt,
  });

  let emailSent = false;
  let emailError: string | undefined;
  try {
    const result = await sendEmail({ to: invite.email, ...mail });
    emailSent = result.sent;
    if (!result.sent) emailError = "No email provider is configured on the API.";
  } catch (err) {
    console.error(`Invite email to ${invite.email} via ${getEmailProvider()} failed:`, err);
    emailError = err instanceof Error ? err.message : "Unknown email error";
  }

  return {
    emailSent,
    emailError,
    // Only super_admins reach this; they need the link to share manually when email fails.
    acceptUrl: emailSent ? undefined : acceptUrl,
  };
}

async function getInviter(invitedById: string) {
  const inviter = await prisma.adminUser.findUnique({
    where: { id: invitedById },
    select: { id: true, name: true },
  });
  if (!inviter) throw new Error("INVITER_NOT_FOUND");
  return inviter;
}

export async function createAdminInvite(input: {
  email: string;
  name: string;
  role: AdminRole;
  invitedById: string;
}) {
  const email = input.email.trim().toLowerCase();

  const existingUser = await prisma.adminUser.findUnique({ where: { email }, select: { disabledAt: true } });
  if (existingUser && !existingUser.disabledAt) {
    throw new Error("ALREADY_ADMIN");
  }

  const inviter = await getInviter(input.invitedById);
  const rawToken = generateInviteToken();

  await prisma.adminInvite.deleteMany({ where: { email, acceptedAt: null } });

  const invite = await prisma.adminInvite.create({
    data: {
      email,
      name: input.name.trim(),
      role: input.role,
      tokenHash: hashInviteToken(rawToken),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      invitedById: inviter.id,
    },
    select: inviteSelect,
  });

  return { invite, ...(await deliverInvite(invite, rawToken, inviter.name)) };
}

export async function resendAdminInvite(inviteId: string, invitedById: string) {
  const existing = await prisma.adminInvite.findUnique({ where: { id: inviteId } });
  if (!existing || existing.acceptedAt) return null;

  const inviter = await getInviter(invitedById);
  const rawToken = generateInviteToken();

  const invite = await prisma.adminInvite.update({
    where: { id: inviteId },
    data: {
      tokenHash: hashInviteToken(rawToken),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      invitedById: inviter.id,
    },
    select: inviteSelect,
  });

  return { invite, ...(await deliverInvite(invite, rawToken, inviter.name)) };
}

export async function revokeAdminInvite(inviteId: string) {
  const result = await prisma.adminInvite.deleteMany({ where: { id: inviteId, acceptedAt: null } });
  return result.count > 0;
}

export async function removeAdminAccess(targetId: string, actorId: string) {
  if (targetId === actorId) throw new Error("CANNOT_REMOVE_SELF");

  const target = await prisma.adminUser.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, disabledAt: true },
  });
  if (!target || target.disabledAt) return null;

  if (target.role === "super_admin") {
    const remaining = await prisma.adminUser.count({
      where: { role: "super_admin", disabledAt: null, id: { not: targetId } },
    });
    if (remaining === 0) throw new Error("LAST_SUPER_ADMIN");
  }

  // Rows are kept so audit logs, tickets and escalations still resolve the admin's name.
  return prisma.adminUser.update({
    where: { id: targetId },
    data: {
      disabledAt: new Date(),
      tokenVersion: { increment: 1 },
      passwordHash: await hashPassword(crypto.randomBytes(32).toString("hex")),
      mfaEnabled: false,
      mfaSecret: null,
    },
    select: { id: true, email: true },
  });
}

export async function getInviteByToken(rawToken: string) {
  const invite = await prisma.adminInvite.findUnique({
    where: { tokenHash: hashInviteToken(rawToken) },
    select: { ...inviteSelect, acceptedAt: true },
  });

  if (!invite || invite.acceptedAt) return null;
  if (invite.expiresAt <= new Date()) return null;

  return invite;
}

export async function acceptAdminInvite(input: { rawToken: string; password: string }) {
  const invite = await prisma.adminInvite.findUnique({ where: { tokenHash: hashInviteToken(input.rawToken) } });
  if (!invite || invite.acceptedAt) {
    throw new Error("INVALID_INVITE");
  }
  if (invite.expiresAt <= new Date()) {
    throw new Error("INVITE_EXPIRED");
  }

  const existingUser = await prisma.adminUser.findUnique({ where: { email: invite.email } });
  if (existingUser && !existingUser.disabledAt) {
    throw new Error("ALREADY_ADMIN");
  }

  const passwordHash = await hashPassword(input.password);
  const select = { id: true, email: true, name: true, role: true, createdAt: true } as const;

  return prisma.$transaction(async (tx) => {
    const user = existingUser
      ? await tx.adminUser.update({
          where: { id: existingUser.id },
          data: {
            name: invite.name,
            role: invite.role,
            passwordHash,
            disabledAt: null,
            failedLoginCount: 0,
            lockedUntil: null,
            tokenVersion: { increment: 1 },
          },
          select,
        })
      : await tx.adminUser.create({
          data: { email: invite.email, name: invite.name, role: invite.role, passwordHash },
          select,
        });

    await tx.adminInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return user;
  });
}
