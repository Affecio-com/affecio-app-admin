import type { ListUsersInput, UpdateUserInput } from "../schemas/users";
import { prisma } from "../lib/prisma";

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
} as const;

export async function listUsers(input: ListUsersInput) {
  const { page, pageSize, search } = input;
  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
          { phoneNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
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

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

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
    stats: {
      mediaCount: user.UserMedia.length,
      matchesCount: matchMap.size,
      blocksGivenCount: user.Block_Block_blockerIdToUser.length,
      blocksReceivedCount: user.Block_Block_blockedIdToUser.length,
      swipesSentCount: user.Swipe_Swipe_fromUserIdToUser.length,
      swipesReceivedCount: user.Swipe_Swipe_toUserIdToUser.length,
      callsCount: callMap.size,
    },
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

export async function updateUser(id: string, input: UpdateUserInput) {
  return prisma.user.update({
    where: { id },
    data: input,
    select: {
      id: true,
      email: true,
      phoneNumber: true,
      name: true,
      aboutMe: true,
      updatedAt: true,
    },
  });
}
