import { Router } from "express";
import { z } from "zod";
import * as supportService from "../services/supportService";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";
import { getRouteParam } from "../lib/params";

const router = Router();

const supportRoles = ["super_admin", "admin", "support"] as const;
const escalationRoles = ["super_admin", "admin", "support", "developer"] as const;

router.use(requireAdminAuth);

const createTicketSchema = z.object({
  userId: z.string().min(1),
  subject: z.string().min(1).max(160),
  category: z.enum(["account", "safety", "matching", "billing", "technical", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  body: z.string().min(1).max(4000),
  asUser: z.boolean().optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(["open", "in_progress", "waiting_on_user", "escalated", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedToId: z.string().nullable().optional(),
});

const messageSchema = z.object({
  body: z.string().min(1).max(4000),
  authorType: z.enum(["user", "agent", "internal"]).default("agent"),
});

const escalateSchema = z.object({
  target: z.enum(["admin", "developer"]),
  reason: z.string().min(1).max(1000),
});

const escalationUpdateSchema = z.object({
  status: z.enum(["open", "acknowledged", "resolved"]),
  notes: z.string().max(2000).optional(),
});

router.get("/stats", requireRole(...supportRoles), async (_req, res) => {
  const stats = await supportService.getSupportStats();
  res.json({ data: stats });
});

router.get("/tickets", requireRole(...supportRoles), async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const userId = typeof req.query.userId === "string" ? req.query.userId : undefined;
  const assignedQuery = typeof req.query.assignedToId === "string" ? req.query.assignedToId : undefined;
  const assignedToId = assignedQuery === "me" ? req.admin!.id : assignedQuery;
  const result = await supportService.listTickets({
    page,
    pageSize,
    status: status as never,
    category: category as never,
    search,
    userId,
    assignedToId,
  });
  res.json(result);
});

router.post(
  "/tickets",
  requireRole(...supportRoles),
  auditAction("support.ticket.create", "support_ticket", (req) => req.body.userId ?? "ticket"),
  async (req, res) => {
    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid ticket payload" });
      return;
    }
    try {
      const ticket = await supportService.createTicket({
        ...parsed.data,
        createdById: req.admin!.id,
      });
      res.status(201).json({ data: ticket });
    } catch (err) {
      if (err instanceof Error && err.message === "USER_NOT_FOUND") {
        res.status(404).json({ message: "App user not found." });
        return;
      }
      res.status(400).json({ message: "Failed to create ticket." });
    }
  },
);

router.get("/tickets/:id", requireRole("super_admin", "admin", "support", "developer"), async (req, res) => {
  const ticket = await supportService.getTicketById(getRouteParam(req.params.id));
  if (!ticket) {
    res.status(404).json({ message: "Ticket not found" });
    return;
  }
  res.json({ data: ticket });
});

router.patch(
  "/tickets/:id",
  requireRole(...supportRoles),
  auditAction("support.ticket.update", "support_ticket", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    const parsed = updateTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid update payload" });
      return;
    }
    const ticket = await supportService.updateTicket(
      getRouteParam(req.params.id),
      parsed.data,
      req.admin!.id,
    );
    if (!ticket) {
      res.status(404).json({ message: "Ticket not found" });
      return;
    }
    res.json({ data: ticket });
  },
);

router.post(
  "/tickets/:id/messages",
  requireRole("super_admin", "admin", "support", "developer"),
  async (req, res) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid message payload" });
      return;
    }
    const ticket = await supportService.addMessage({
      ticketId: getRouteParam(req.params.id),
      body: parsed.data.body,
      authorType: parsed.data.authorType,
      adminId: req.admin!.id,
    });
    if (!ticket) {
      res.status(404).json({ message: "Ticket not found" });
      return;
    }
    res.status(201).json({ data: ticket });
  },
);

router.post(
  "/tickets/:id/escalate",
  requireRole(...supportRoles),
  auditAction("support.escalate", "support_ticket", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    const parsed = escalateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid escalation payload" });
      return;
    }
    const ticket = await supportService.escalateTicket({
      ticketId: getRouteParam(req.params.id),
      target: parsed.data.target,
      reason: parsed.data.reason,
      createdById: req.admin!.id,
    });
    if (!ticket) {
      res.status(404).json({ message: "Ticket not found" });
      return;
    }
    res.status(201).json({ data: ticket });
  },
);

router.get("/escalations", requireRole(...escalationRoles), async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const target = typeof req.query.target === "string" ? req.query.target : undefined;
  const result = await supportService.listEscalations({
    page,
    pageSize,
    status: status as never,
    target: target as never,
  });
  res.json(result);
});

router.patch(
  "/escalations/:id",
  requireRole("super_admin", "admin", "developer"),
  async (req, res) => {
    const parsed = escalationUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid escalation update" });
      return;
    }
    try {
      const escalation = await supportService.updateEscalation(
        getRouteParam(req.params.id),
        parsed.data,
        req.admin!.id,
      );
      res.json({ data: escalation });
    } catch {
      res.status(404).json({ message: "Escalation not found" });
    }
  },
);

export default router;
