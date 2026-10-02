import type {
  SupportEscalationStatus,
  SupportEscalationTarget,
  SupportMessageAuthor,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { hydrateUsersByIds } from "../lib/profilePhotos";

const SLA_HOURS: Record<SupportTicketPriority, number> = {
  urgent: 1,
  high: 4,
  medium: 24,
  low: 48,
};

function withSla<T extends { priority: SupportTicketPriority; status: SupportTicketStatus; createdAt: Date }>(
  ticket: T,
) {
  const slaHours = SLA_HOURS[ticket.priority];
  const slaDueAt = new Date(ticket.createdAt.getTime() + slaHours * 60 * 60 * 1000);
  const open = !["resolved", "closed"].includes(ticket.status);
  return {
    slaHours,
    slaDueAt: slaDueAt.toISOString(),
    slaBreached: open && Date.now() > slaDueAt.getTime(),
  };
}

const ticketInclude = {
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
  createdBy: { select: { id: true, name: true, email: true, role: true } },
} as const;

async function serializeTickets<T extends { userId: string }>(tickets: T[]) {
  const users = await hydrateUsersByIds(tickets.map((t) => t.userId));
  return tickets.map((ticket) => ({
    ...ticket,
    user: users.get(ticket.userId) ?? null,
  }));
}

export async function getSupportStats() {
  const [open, inProgress, escalated, waiting, resolvedToday] = await Promise.all([
    prisma.supportTicket.count({ where: { status: "open" } }),
    prisma.supportTicket.count({ where: { status: "in_progress" } }),
    prisma.supportTicket.count({ where: { status: "escalated" } }),
    prisma.supportTicket.count({ where: { status: "waiting_on_user" } }),
    prisma.supportTicket.count({
      where: {
        status: { in: ["resolved", "closed"] },
        resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return { open, inProgress, escalated, waiting, resolvedToday };
}

export async function listTickets(input: {
  page: number;
  pageSize: number;
  status?: SupportTicketStatus;
  category?: SupportTicketCategory;
  search?: string;
  assignedToId?: string;
  userId?: string;
}) {
  const { page, pageSize, status, category, search, assignedToId, userId } = input;
  const where: Record<string, unknown> = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(assignedToId ? { assignedToId } : {}),
    ...(userId ? { userId } : {}),
  };

  if (search) {
    const matchingUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
        ],
      },
      select: { id: true },
      take: 50,
    });
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { id: { contains: search, mode: "insensitive" } },
      { userId: { in: matchingUsers.map((u) => u.id) } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      include: {
        ...ticketInclude,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true, escalations: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  const data = await serializeTickets(rows);

  return {
    data: data.map((ticket) => ({
      ...ticket,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      ...withSla(ticket),
      lastMessage: ticket.messages[0]
        ? {
            body: ticket.messages[0].body,
            authorType: ticket.messages[0].authorType,
            createdAt: ticket.messages[0].createdAt.toISOString(),
          }
        : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getTicketById(id: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      ...ticketInclude,
      messages: {
        orderBy: { createdAt: "asc" },
        include: { admin: { select: { id: true, name: true, role: true } } },
      },
      escalations: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          handledBy: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });
  if (!ticket) return null;

  const [serialized] = await serializeTickets([ticket]);
  return {
    ...serialized,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    ...withSla(ticket),
    messages: ticket.messages.map((m) => ({
      id: m.id,
      authorType: m.authorType,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      admin: m.admin,
    })),
    escalations: ticket.escalations.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      resolvedAt: e.resolvedAt?.toISOString() ?? null,
    })),
  };
}

export async function createTicket(input: {
  userId: string;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  body: string;
  createdById: string;
  asUser?: boolean;
}) {
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: input.userId,
      subject: input.subject,
      category: input.category,
      priority: input.priority,
      status: "open",
      createdById: input.createdById,
      assignedToId: input.createdById,
      messages: {
        create: {
          authorType: input.asUser ? "user" : "agent",
          adminId: input.asUser ? null : input.createdById,
          body: input.body,
        },
      },
    },
  });

  return getTicketById(ticket.id);
}

export async function updateTicket(
  id: string,
  input: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    assignedToId?: string | null;
  },
  adminId: string,
) {
  const data: Record<string, unknown> = {};
  if (input.status) {
    data.status = input.status;
    if (input.status === "resolved" || input.status === "closed") {
      data.resolvedAt = new Date();
    }
  }
  if (input.priority) data.priority = input.priority;
  if (input.assignedToId !== undefined) data.assignedToId = input.assignedToId;

  const existing = await prisma.supportTicket.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return null;

  await prisma.supportTicket.update({ where: { id }, data });

  if (input.status) {
    await prisma.supportMessage.create({
      data: {
        ticketId: id,
        authorType: "system",
        adminId,
        body: `Ticket status changed to ${input.status.replace(/_/g, " ")}.`,
      },
    });
  }

  return getTicketById(id);
}

export async function addMessage(input: {
  ticketId: string;
  body: string;
  authorType: SupportMessageAuthor;
  adminId: string;
}) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) return null;

  await prisma.supportMessage.create({
    data: {
      ticketId: input.ticketId,
      body: input.body,
      authorType: input.authorType,
      adminId: input.authorType === "agent" || input.authorType === "system" ? input.adminId : null,
    },
  });

  const isActive = ticket.status !== "resolved" && ticket.status !== "closed";
  const nextStatus =
    input.authorType === "agent" && isActive
      ? "waiting_on_user"
      : input.authorType === "user" && ticket.status === "waiting_on_user"
        ? "in_progress"
        : ticket.status;

  if (nextStatus !== ticket.status) {
    await prisma.supportTicket.update({
      where: { id: input.ticketId },
      data: { status: nextStatus },
    });
  } else {
    await prisma.supportTicket.update({
      where: { id: input.ticketId },
      data: { updatedAt: new Date() },
    });
  }

  return getTicketById(input.ticketId);
}

export async function escalateTicket(input: {
  ticketId: string;
  target: SupportEscalationTarget;
  reason: string;
  createdById: string;
}) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) return null;

  await prisma.supportEscalation.create({
    data: {
      ticketId: input.ticketId,
      target: input.target,
      reason: input.reason,
      createdById: input.createdById,
    },
  });

  await prisma.supportTicket.update({
    where: { id: input.ticketId },
    data: { status: "escalated" },
  });

  await prisma.supportMessage.create({
    data: {
      ticketId: input.ticketId,
      authorType: "system",
      adminId: input.createdById,
      body: `Escalated to ${input.target}: ${input.reason}`,
    },
  });

  return getTicketById(input.ticketId);
}

export async function listEscalations(input: {
  page: number;
  pageSize: number;
  status?: SupportEscalationStatus;
  target?: SupportEscalationTarget;
}) {
  const { page, pageSize, status, target } = input;
  const where = {
    ...(status ? { status } : {}),
    ...(target ? { target } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.supportEscalation.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        handledBy: { select: { id: true, name: true, role: true } },
        ticket: {
          include: ticketInclude,
        },
      },
    }),
    prisma.supportEscalation.count({ where }),
  ]);

  const users = await hydrateUsersByIds(rows.map((r) => r.ticket.userId));

  return {
    data: rows.map((row) => ({
      id: row.id,
      ticketId: row.ticketId,
      target: row.target,
      reason: row.reason,
      status: row.status,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      createdBy: row.createdBy,
      handledBy: row.handledBy,
      ticket: {
        id: row.ticket.id,
        subject: row.ticket.subject,
        category: row.ticket.category,
        priority: row.ticket.priority,
        status: row.ticket.status,
        user: users.get(row.ticket.userId) ?? null,
      },
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateEscalation(
  id: string,
  input: { status: SupportEscalationStatus; notes?: string },
  adminId: string,
) {
  const escalation = await prisma.supportEscalation.update({
    where: { id },
    data: {
      status: input.status,
      notes: input.notes,
      handledById: adminId,
      resolvedAt: input.status === "resolved" ? new Date() : null,
    },
  });

  if (input.status === "resolved") {
    const openCount = await prisma.supportEscalation.count({
      where: { ticketId: escalation.ticketId, status: { in: ["open", "acknowledged"] } },
    });
    if (openCount === 0) {
      await prisma.supportTicket.update({
        where: { id: escalation.ticketId },
        data: { status: "in_progress" },
      });
    }
    await prisma.supportMessage.create({
      data: {
        ticketId: escalation.ticketId,
        authorType: "system",
        adminId,
        body: `Escalation marked ${input.status}${input.notes ? `: ${input.notes}` : "."}`,
      },
    });
  }

  return escalation;
}
