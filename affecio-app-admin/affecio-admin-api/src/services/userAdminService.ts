import { randomUUID } from "crypto";
import type { UserAdminActionType } from "@prisma/client";
import type {
  AccountStatus,
  ActivityStatus,
  CreateUserInput,
  EnforceAction,
  ListUsersInput,
  UpdateUserInput,
} from "../schemas/users";
import { prisma } from "../lib/prisma";
import { getProfilePhotoMap, hydrateUsersByIds, withPhoto } from "../lib/profilePhotos";

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
} as const;

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function mapUserRef(
  user: { id: string; name: string; email: string | null; phoneNumber?: string },
  profilePhotoUrl: string | null = null,
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
    profilePhotoUrl,
  };
}

export function getActivityStatus(updatedAt: Date): ActivityStatus {
  const days = (Date.now() - updatedAt.getTime()) / 86_400_000;
  if (days <= 7) return "active";
  if (days <= 30) return "recent";
  if (days <= 90) return "inactive";
  return "dormant";
}

function activityDateRange(status: ActivityStatus): { gte?: Date; lt?: Date } {
  const now = Date.now();
  const day = 86_400_000;
  switch (status) {
    case "active":
      return { gte: new Date(now - 7 * day) };
    case "recent":
      return { gte: new Date(now - 30 * day), lt: new Date(now - 7 * day) };
    case "inactive":
      return { gte: new Date(now - 90 * day), lt: new Date(now - 30 * day) };
    case "dormant":
      return { lt: new Date(now - 90 * day) };
  }
}

function parseBirthday(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  return new Date(value);
}

function computeProfileCompleteness(user: {
  name: string;
  email: string | null;
  aboutMe: string | null;
  gender: string;
  location: unknown;
  lookingFor: string[];
  startConversation: string | null;
  comfortableWith: string | null;
  customQuestion: string | null;
  mediaCount: number;
}): number {
  const checks = [
    Boolean(user.name?.trim()),
    Boolean(user.email?.trim()),
    Boolean(user.aboutMe?.trim()),
    Boolean(user.gender?.trim()),
    user.location != null,
    user.lookingFor.length > 0,
    Boolean(user.startConversation?.trim()),
    Boolean(user.comfortableWith?.trim()),
    Boolean(user.customQuestion?.trim()),
    user.mediaCount > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

async function enrichUserListItems(
  users: {
    id: string;
    email: string | null;
    phoneNumber: string;
    name: string;
    gender: string;
    createdAt: Date;
    updatedAt: Date;
  }[],
) {
  if (users.length === 0) return [];

  const userIds = users.map((u) => u.id);

  const [metaRows, reportCounts, openReportCounts, verifications, mediaCounts, photoMap] =
    await Promise.all([
    prisma.userAdminMeta.findMany({ where: { userId: { in: userIds } } }),
    prisma.report.groupBy({
      by: ["targetId"],
      where: { targetId: { in: userIds } },
      _count: { _all: true },
    }),
    prisma.report.groupBy({
      by: ["targetId"],
      where: { targetId: { in: userIds }, status: "open" },
      _count: { _all: true },
    }),
    prisma.verification.findMany({
      where: { userId: { in: userIds } },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.userMedia.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { _all: true },
    }),
    getProfilePhotoMap(userIds),
  ]);

  const metaMap = new Map(metaRows.map((m) => [m.userId, m]));
  const reportMap = new Map(reportCounts.map((r) => [r.targetId, r._count._all]));
  const openReportMap = new Map(openReportCounts.map((r) => [r.targetId, r._count._all]));
  const mediaMap = new Map(mediaCounts.map((m) => [m.userId, m._count._all]));

  const verificationMap = new Map<string, (typeof verifications)[number]>();
  for (const v of verifications) {
    if (!verificationMap.has(v.userId)) verificationMap.set(v.userId, v);
  }

  return users.map((user) => {
    const meta = metaMap.get(user.id);
    const accountStatus: AccountStatus = meta?.status ?? "active";
    const verification = verificationMap.get(user.id);
    const mediaCount = mediaMap.get(user.id) ?? 0;

    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      name: user.name,
      gender: user.gender,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      accountStatus,
      activityStatus: getActivityStatus(user.updatedAt),
      reportsCount: reportMap.get(user.id) ?? 0,
      openReportsCount: openReportMap.get(user.id) ?? 0,
      verificationStatus: verification?.status ?? "none",
      profileCompleteness: computeProfileCompleteness({
        name: user.name,
        email: user.email,
        aboutMe: null,
        gender: user.gender,
        location: null,
        lookingFor: [],
        startConversation: null,
        comfortableWith: null,
        customQuestion: null,
        mediaCount,
      }),
      mediaCount,
      profilePhotoUrl: photoMap.get(user.id) ?? null,
    };
  });
}

export async function listUsers(input: ListUsersInput) {
  const { page, pageSize, search, accountStatus, activityStatus, hasOpenReports } = input;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { phoneNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (activityStatus) {
    const range = activityDateRange(activityStatus);
    where.updatedAt = range;
  }

  if (accountStatus && accountStatus !== "active") {
    const metaRows = await prisma.userAdminMeta.findMany({
      where: { status: accountStatus },
      select: { userId: true },
    });
    const filteredUserIds = metaRows.map((m) => m.userId);
    if (filteredUserIds.length === 0) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    where.id = { in: filteredUserIds };
  } else if (accountStatus === "active") {
    const nonActive = await getNonActiveUserIds();
    if (nonActive.length > 0) {
      where.id = { notIn: nonActive };
    }
  }

  if (hasOpenReports === true) {
    const openTargets = await prisma.report.findMany({
      where: { status: "open" },
      select: { targetId: true },
      distinct: ["targetId"],
    });
    const ids = openTargets.map((r) => r.targetId);
    if (ids.length === 0) {
      return { data: [], total: 0, page, pageSize, totalPages: 0 };
    }
    const existingIdFilter = where.id as { in?: string[]; notIn?: string[] } | undefined;
    if (existingIdFilter?.in) {
      where.id = { in: existingIdFilter.in.filter((id) => ids.includes(id)) };
    } else {
      where.id = { in: ids };
    }
  }

  const [rawData, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        name: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const data = await enrichUserListItems(rawData);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

async function getNonActiveUserIds(): Promise<string[]> {
  const rows = await prisma.userAdminMeta.findMany({
    where: { status: { not: "active" } },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}

export async function createUser(input: CreateUserInput) {
  const now = new Date();
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      name: input.name,
      phoneNumber: input.phoneNumber,
      email: input.email ?? null,
      gender: input.gender,
      birthday: parseBirthday(input.birthday),
      lookingFor: input.lookingFor,
      aboutMe: input.aboutMe ?? null,
      startConversation: input.startConversation ?? null,
      comfortableWith: input.comfortableWith ?? null,
      updatedAt: now,
    },
  });

  await prisma.userAdminMeta.create({
    data: { userId: user.id, status: "active" },
  });

  const [enriched] = await enrichUserListItems([user]);
  return enriched;
}

export async function deleteUser(id: string) {
  await prisma.userAdminAction.deleteMany({ where: { userId: id } });
  await prisma.userAdminMeta.deleteMany({ where: { userId: id } });
  await prisma.pushDeviceToken.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  return { deleted: true };
}

async function logAdminAction(input: {
  userId: string;
  adminId: string;
  action: UserAdminActionType;
  reason?: string | null;
}) {
  await prisma.userAdminAction.create({
    data: {
      userId: input.userId,
      adminId: input.adminId,
      action: input.action,
      reason: input.reason ?? null,
    },
  });
}

const ENFORCE_STATUS: Record<EnforceAction, AccountStatus> = {
  warn: "warned",
  restrict: "restricted",
  shadowban: "shadowbanned",
  suspend: "suspended",
  ban: "banned",
  restore: "active",
};

const ENFORCE_REASON: Record<EnforceAction, string> = {
  warn: "Formal warning issued",
  restrict: "Discovery restricted",
  shadowban: "Removed from discovery (shadowban)",
  suspend: "Temporarily suspended",
  ban: "Permanently banned",
  restore: "Account restored to active",
};

async function upsertAdminMeta(
  userId: string,
  data: {
    status?: AccountStatus;
    statusReason?: string | null;
    adminNotes?: string | null;
    statusChangedBy?: string;
  },
) {
  const existing = await prisma.userAdminMeta.findUnique({ where: { userId } });
  const statusChanged = data.status && data.status !== existing?.status;

  return prisma.userAdminMeta.upsert({
    where: { userId },
    create: {
      userId,
      status: data.status ?? "active",
      statusReason: data.statusReason ?? null,
      adminNotes: data.adminNotes ?? null,
      statusChangedAt: statusChanged ? new Date() : null,
      statusChangedBy: statusChanged ? data.statusChangedBy : null,
    },
    update: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.statusReason !== undefined ? { statusReason: data.statusReason } : {}),
      ...(data.adminNotes !== undefined ? { adminNotes: data.adminNotes } : {}),
      ...(statusChanged
        ? { statusChangedAt: new Date(), statusChangedBy: data.statusChangedBy ?? null }
        : {}),
    },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      UserMedia: { orderBy: [{ kind: "asc" }, { sortOrder: "asc" }] },
      Block_Block_blockerIdToUser: {
        orderBy: { createdAt: "desc" },
        include: { User_Block_blockedIdToUser: { select: userSummarySelect } },
      },
      Block_Block_blockedIdToUser: {
        orderBy: { createdAt: "desc" },
        include: { User_Block_blockerIdToUser: { select: userSummarySelect } },
      },
      Match_Match_userAIdToUser: {
        orderBy: { createdAt: "desc" },
        include: { User_Match_userBIdToUser: { select: userSummarySelect } },
      },
      Match_Match_userBIdToUser: {
        orderBy: { createdAt: "desc" },
        include: { User_Match_userAIdToUser: { select: userSummarySelect } },
      },
      Swipe_Swipe_fromUserIdToUser: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { User_Swipe_toUserIdToUser: { select: userSummarySelect } },
      },
      Swipe_Swipe_toUserIdToUser: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { User_Swipe_fromUserIdToUser: { select: userSummarySelect } },
      },
      CallSession_CallSession_userAIdToUser: {
        orderBy: { startedAt: "desc" },
        take: 50,
        include: { User_CallSession_userBIdToUser: { select: userSummarySelect } },
      },
      CallSession_CallSession_userBIdToUser: {
        orderBy: { startedAt: "desc" },
        take: 50,
        include: { User_CallSession_userAIdToUser: { select: userSummarySelect } },
      },
    },
  });

  if (!user) return null;

  const [adminMeta, reportsAsTarget, reportsFiled, verifications, pushTokens, caseHistory] = await Promise.all([
    prisma.userAdminMeta.findUnique({ where: { userId: id } }),
    prisma.report.findMany({
      where: { targetId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.report.findMany({
      where: { reporterId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.verification.findMany({
      where: { userId: id },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.pushDeviceToken.findMany({
      where: { userId: id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.userAdminAction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { admin: { select: { id: true, name: true, role: true } } },
    }),
  ]);

  const matchMap = new Map<string, { id: string; createdAt: string; otherUser: ReturnType<typeof mapUserRef> }>();
  for (const m of user.Match_Match_userAIdToUser) {
    matchMap.set(m.id, {
      id: m.id,
      createdAt: m.createdAt.toISOString(),
      otherUser: mapUserRef(m.User_Match_userBIdToUser),
    });
  }
  for (const m of user.Match_Match_userBIdToUser) {
    if (!matchMap.has(m.id)) {
      matchMap.set(m.id, {
        id: m.id,
        createdAt: m.createdAt.toISOString(),
        otherUser: mapUserRef(m.User_Match_userAIdToUser),
      });
    }
  }

  const callMap = new Map<
    string,
    {
      id: string;
      channelName: string;
      status: string;
      startedAt: string;
      endedAt: string | null;
      otherUser: ReturnType<typeof mapUserRef>;
    }
  >();
  for (const c of user.CallSession_CallSession_userAIdToUser) {
    callMap.set(c.id, {
      id: c.id,
      channelName: c.channelName,
      status: c.status,
      startedAt: c.startedAt.toISOString(),
      endedAt: toIso(c.endedAt),
      otherUser: mapUserRef(c.User_CallSession_userBIdToUser),
    });
  }
  for (const c of user.CallSession_CallSession_userBIdToUser) {
    if (!callMap.has(c.id)) {
      callMap.set(c.id, {
        id: c.id,
        channelName: c.channelName,
        status: c.status,
        startedAt: c.startedAt.toISOString(),
        endedAt: toIso(c.endedAt),
        otherUser: mapUserRef(c.User_CallSession_userAIdToUser),
      });
    }
  }

  const openReportsCount = reportsAsTarget.filter((r) => r.status === "open").length;
  const accountStatus: AccountStatus = adminMeta?.status ?? "active";
  const latestVerification = verifications[0] ?? null;
  const confirmedMedia = user.UserMedia.filter((m) => m.status === "CONFIRMED").length;
  const pendingMedia = user.UserMedia.filter((m) => m.status === "PENDING").length;

  const relatedIds = [
    user.id,
    ...Array.from(matchMap.values()).map((m) => m.otherUser.id),
    ...user.Block_Block_blockerIdToUser.map((b) => b.User_Block_blockedIdToUser.id),
    ...user.Block_Block_blockedIdToUser.map((b) => b.User_Block_blockerIdToUser.id),
    ...user.Swipe_Swipe_fromUserIdToUser.map((s) => s.User_Swipe_toUserIdToUser.id),
    ...user.Swipe_Swipe_toUserIdToUser.map((s) => s.User_Swipe_fromUserIdToUser.id),
    ...Array.from(callMap.values()).map((c) => c.otherUser.id),
    ...reportsAsTarget.map((r) => r.reporterId),
    ...reportsFiled.map((r) => r.targetId),
  ];
  const [photoMap, reportPeople] = await Promise.all([
    getProfilePhotoMap(relatedIds),
    hydrateUsersByIds([
      ...reportsAsTarget.map((r) => r.reporterId),
      ...reportsFiled.map((r) => r.targetId),
    ]),
  ]);
  const patchRef = <T extends { id: string }>(ref: T) => withPhoto(ref, photoMap);

  const ownPhoto =
    photoMap.get(user.id) ??
    user.UserMedia.find((m) => m.kind === "PROFILE_PHOTO" && m.publicUrl)?.publicUrl ??
    null;

  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    email: user.email,
    name: user.name,
    birthday: user.birthday.toISOString(),
    gender: user.gender,
    location: user.location,
    lookingFor: user.lookingFor,
    aboutMe: user.aboutMe,
    startConversation: user.startConversation,
    comfortableWith: user.comfortableWith,
    customQuestion: user.customQuestion,
    customAnswer: user.customAnswer,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    profilePhotoUrl: ownPhoto,
    accountStatus,
    activityStatus: getActivityStatus(user.updatedAt),
    statusReason: adminMeta?.statusReason ?? null,
    adminNotes: adminMeta?.adminNotes ?? null,
    statusChangedAt: adminMeta?.statusChangedAt?.toISOString() ?? null,
    verificationStatus: latestVerification?.status ?? "none",
    profileCompleteness: computeProfileCompleteness({
      name: user.name,
      email: user.email,
      aboutMe: user.aboutMe,
      gender: user.gender,
      location: user.location,
      lookingFor: user.lookingFor,
      startConversation: user.startConversation,
      comfortableWith: user.comfortableWith,
      customQuestion: user.customQuestion,
      mediaCount: user.UserMedia.length,
    }),
    reportsSummary: {
      totalAsTarget: reportsAsTarget.length,
      openAsTarget: openReportsCount,
      filedByUser: reportsFiled.length,
    },
    mediaSummary: {
      total: user.UserMedia.length,
      confirmed: confirmedMedia,
      pending: pendingMedia,
      hasProfilePhoto: user.UserMedia.some((m) => m.kind === "PROFILE_PHOTO"),
      hasIntroVideo: user.UserMedia.some((m) => m.kind === "INTRO_VIDEO"),
      isVerified: user.UserMedia.some(
        (m) => m.kind === "VERIFICATION_PHOTO" && m.status === "CONFIRMED",
      ),
    },
    pushTokens: pushTokens.map((t) => ({
      id: t.id,
      platform: t.platform,
      updatedAt: t.updatedAt.toISOString(),
    })),
    stats: {
      mediaCount: user.UserMedia.length,
      matchesCount: matchMap.size,
      blocksGivenCount: user.Block_Block_blockerIdToUser.length,
      blocksReceivedCount: user.Block_Block_blockedIdToUser.length,
      swipesSentCount: user.Swipe_Swipe_fromUserIdToUser.length,
      swipesReceivedCount: user.Swipe_Swipe_toUserIdToUser.length,
      callsCount: callMap.size,
    },
    reportsAsTarget: reportsAsTarget.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      reason: r.reason,
      reporterId: r.reporterId,
      reporter: reportPeople.get(r.reporterId) ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    reportsFiled: reportsFiled.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      reason: r.reason,
      targetId: r.targetId,
      target: reportPeople.get(r.targetId) ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
    verifications: verifications.map((v) => ({
      id: v.id,
      status: v.status,
      mediaKey: v.mediaKey,
      submittedAt: v.submittedAt.toISOString(),
      reviewedAt: v.reviewedAt?.toISOString() ?? null,
    })),
    media: user.UserMedia.map((m) => ({
      id: m.id,
      kind: m.kind,
      objectKey: m.objectKey,
      mimeType: m.mimeType,
      publicUrl: m.publicUrl,
      sortOrder: m.sortOrder,
      metadata: m.metadata,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
    })),
    matches: Array.from(matchMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((m) => ({ ...m, otherUser: patchRef(m.otherUser) })),
    blocksGiven: user.Block_Block_blockerIdToUser.map((b) => ({
      id: b.id,
      createdAt: b.createdAt.toISOString(),
      blockedUser: patchRef(mapUserRef(b.User_Block_blockedIdToUser)),
    })),
    blocksReceived: user.Block_Block_blockedIdToUser.map((b) => ({
      id: b.id,
      createdAt: b.createdAt.toISOString(),
      blocker: patchRef(mapUserRef(b.User_Block_blockerIdToUser)),
    })),
    swipesSent: user.Swipe_Swipe_fromUserIdToUser.map((s) => ({
      id: s.id,
      action: s.action,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      targetUser: patchRef(mapUserRef(s.User_Swipe_toUserIdToUser)),
    })),
    swipesReceived: user.Swipe_Swipe_toUserIdToUser.map((s) => ({
      id: s.id,
      action: s.action,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      fromUser: patchRef(mapUserRef(s.User_Swipe_fromUserIdToUser)),
    })),
    calls: Array.from(callMap.values())
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .map((c) => ({ ...c, otherUser: patchRef(c.otherUser) })),
    caseHistory: caseHistory.map((item) => ({
      id: item.id,
      action: item.action,
      reason: item.reason,
      createdAt: item.createdAt.toISOString(),
      admin: item.admin,
    })),
  };
}

export async function updateUser(id: string, input: UpdateUserInput, adminId?: string) {
  const { adminNotes, ...profileFields } = input;

  const hasProfileUpdate = Object.keys(profileFields).length > 0;

  if (hasProfileUpdate) {
    await prisma.user.update({
      where: { id },
      data: {
        ...profileFields,
        updatedAt: new Date(),
      },
    });
    if (adminId) {
      await logAdminAction({
        userId: id,
        adminId,
        action: "edit_profile",
        reason: "Profile fields updated",
      });
    }
  }

  if (adminNotes !== undefined) {
    await upsertAdminMeta(id, {
      adminNotes,
      statusChangedBy: adminId,
    });
  }

  return getUserById(id);
}

export async function enforceUser(id: string, action: EnforceAction, reason: string, adminId: string) {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return null;

  const status = ENFORCE_STATUS[action];
  await upsertAdminMeta(id, {
    status,
    statusReason: reason || ENFORCE_REASON[action],
    statusChangedBy: adminId,
  });
  await logAdminAction({
    userId: id,
    adminId,
    action,
    reason: reason || ENFORCE_REASON[action],
  });
  return getUserById(id);
}

export async function addUserNote(id: string, body: string, adminId: string) {
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return null;

  const meta = await prisma.userAdminMeta.findUnique({ where: { userId: id } });
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const nextNotes = meta?.adminNotes ? `${meta.adminNotes}\n[${stamp}] ${body}` : `[${stamp}] ${body}`;

  await upsertAdminMeta(id, { adminNotes: nextNotes, statusChangedBy: adminId });
  await logAdminAction({ userId: id, adminId, action: "note", reason: body });
  return getUserById(id);
}

export async function setMediaHidden(userId: string, mediaId: string, hidden: boolean, adminId: string) {
  const media = await prisma.userMedia.findFirst({ where: { id: mediaId, userId } });
  if (!media) return null;

  await prisma.userMedia.update({
    where: { id: mediaId },
    data: { status: hidden ? "HIDDEN" : "CONFIRMED" },
  });
  await logAdminAction({
    userId,
    adminId,
    action: hidden ? "hide_media" : "unhide_media",
    reason: hidden ? `Hid media ${media.kind}` : `Restored media ${media.kind}`,
  });
  return getUserById(userId);
}
