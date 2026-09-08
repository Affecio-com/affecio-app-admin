import { randomUUID } from "crypto";
import type {
  AccountStatus,
  ActivityStatus,
  CreateUserInput,
  ListUsersInput,
  UpdateUserInput,
} from "../schemas/users";
import { prisma } from "../lib/prisma";

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

function mapUserRef(user: { id: string; name: string; email: string | null; phoneNumber?: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber ?? null,
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

  const [metaRows, reportCounts, openReportCounts, verifications, mediaCounts] = await Promise.all([
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
  await prisma.userAdminMeta.deleteMany({ where: { userId: id } });
  await prisma.pushDeviceToken.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  return { deleted: true };
}

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

  const [adminMeta, reportsAsTarget, reportsFiled, verifications, pushTokens] = await Promise.all([
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
      createdAt: r.createdAt.toISOString(),
    })),
    reportsFiled: reportsFiled.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      reason: r.reason,
      targetId: r.targetId,
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
    matches: Array.from(matchMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    blocksGiven: user.Block_Block_blockerIdToUser.map((b) => ({
      id: b.id,
      createdAt: b.createdAt.toISOString(),
      blockedUser: mapUserRef(b.User_Block_blockedIdToUser),
    })),
    blocksReceived: user.Block_Block_blockedIdToUser.map((b) => ({
      id: b.id,
      createdAt: b.createdAt.toISOString(),
      blocker: mapUserRef(b.User_Block_blockerIdToUser),
    })),
    swipesSent: user.Swipe_Swipe_fromUserIdToUser.map((s) => ({
      id: s.id,
      action: s.action,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      targetUser: mapUserRef(s.User_Swipe_toUserIdToUser),
    })),
    swipesReceived: user.Swipe_Swipe_toUserIdToUser.map((s) => ({
      id: s.id,
      action: s.action,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      fromUser: mapUserRef(s.User_Swipe_fromUserIdToUser),
    })),
    calls: Array.from(callMap.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    ),
  };
}

export async function updateUser(id: string, input: UpdateUserInput, adminId?: string) {
  const {
    accountStatus,
    statusReason,
    adminNotes,
    ...profileFields
  } = input;

  const hasProfileUpdate = Object.keys(profileFields).length > 0;

  if (hasProfileUpdate) {
    await prisma.user.update({
      where: { id },
      data: {
        ...profileFields,
        updatedAt: new Date(),
      },
    });
  }

  if (accountStatus !== undefined || statusReason !== undefined || adminNotes !== undefined) {
    await upsertAdminMeta(id, {
      status: accountStatus,
      statusReason,
      adminNotes,
      statusChangedBy: adminId,
    });
  }

  return getUserById(id);
}
