import type { ListUsersInput, UpdateUserInput } from "../schemas/users";
import { prisma } from "../lib/prisma";

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

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      UserMedia: true,
      Block_Block_blockerIdToUser: { take: 10, orderBy: { createdAt: "desc" } },
      Match_Match_userAIdToUser: { take: 10, orderBy: { createdAt: "desc" } },
    },
  });
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
