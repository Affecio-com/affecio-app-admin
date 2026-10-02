import type { AdminRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { generateInviteToken, hashInviteToken } from "../lib/inviteToken";
import { hashPassword } from "../lib/password";
import { buildAdminInviteEmail } from "../email/adminInviteEmail";
import { sendEmail } from "../email/sendEmail";

const INVITE_TTL_MS = (Number(process.env.INVITE_TTL_DAYS ?? 7) || 7) * 24 * 60 * 60 * 1000;

function roleLabel(role: AdminRole): string {
  return role.replace(/_/g, " ");
}

function portalBaseUrl(): string {
  return (process.env.ADMIN_PORTAL_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function listPendingInvites() {
  return prisma.adminInvite.findMany({
    where: { acceptedAt: null, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      expiresAt: true,
      createdAt: true,
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAdminInvite(input: {
  email: string;
  name: string;
  role: AdminRole;
  invitedById: string;
}) {
  const email = input.email.trim().toLowerCase();

  const existingUser = await prisma.adminUser.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("ALREADY_ADMIN");
  }

  const inviter = await prisma.adminUser.findUnique({
    where: { id: input.invitedById },
    select: { id: true, name: true, email: true },
  });
  if (!inviter) {
    throw new Error("INVITER_NOT_FOUND");
  }

  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await prisma.adminInvite.deleteMany({
    where: { email, acceptedAt: null },
  });

  const invite = await prisma.adminInvite.create({
    data: {
      email,
      name: input.name.trim(),
      role: input.role,
      tokenHash,
      expiresAt,
      invitedById: inviter.id,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  const acceptUrl = `${portalBaseUrl()}/invite/${rawToken}`;
  const organizationName = process.env.EMAIL_INVITE_ORG_NAME ?? "Affecio Pvt Ltd";
  const projectName = process.env.EMAIL_INVITE_PROJECT_NAME ?? "Affecio Admin Console";

  const mail = buildAdminInviteEmail({
    inviteeName: invite.name,
    inviteeEmail: invite.email,
    inviterName: inviter.name,
    organizationName,
    projectName,
    roleLabel: roleLabel(invite.role),
    acceptUrl,
    expiresAt: invite.expiresAt,
  });

  const emailResult = await sendEmail({
    to: invite.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  return {
    invite,
    acceptUrl: process.env.NODE_ENV === "production" ? undefined : acceptUrl,
    emailSent: emailResult.sent,
    emailPreviewUrl: emailResult.previewUrl,
  };
}

export async function getInviteByToken(rawToken: string) {
  const tokenHash = hashInviteToken(rawToken);
  const invite = await prisma.adminInvite.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
    },
  });

  if (!invite || invite.acceptedAt) return null;
  if (invite.expiresAt <= new Date()) return null;

  return invite;
}

export async function acceptAdminInvite(input: { rawToken: string; password: string }) {
  const tokenHash = hashInviteToken(input.rawToken);

  const invite = await prisma.adminInvite.findUnique({ where: { tokenHash } });
  if (!invite || invite.acceptedAt) {
    throw new Error("INVALID_INVITE");
  }
  if (invite.expiresAt <= new Date()) {
    throw new Error("INVITE_EXPIRED");
  }

  const existingUser = await prisma.adminUser.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    throw new Error("ALREADY_ADMIN");
  }

  const passwordHash = await hashPassword(input.password);

  const admin = await prisma.$transaction(async (tx) => {
    const user = await tx.adminUser.create({
      data: {
        email: invite.email,
        name: invite.name,
        role: invite.role,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    await tx.adminInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return user;
  });

  return admin;
}
