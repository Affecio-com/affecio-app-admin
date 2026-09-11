import { adminV1Client } from "@/config/api";
import type { PaginatedResponse } from "@/types/api";
import type { UserRef } from "@/types/user";

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "waiting_on_user"
  | "escalated"
  | "resolved"
  | "closed";
export type SupportTicketCategory =
  | "account"
  | "safety"
  | "matching"
  | "billing"
  | "technical"
  | "other";
export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";
export type SupportMessageAuthor = "user" | "agent" | "system" | "internal";
export type SupportEscalationTarget = "admin" | "developer";
export type SupportEscalationStatus = "open" | "acknowledged" | "resolved";

export interface SupportAdminRef {
  id: string;
  name: string;
  email?: string;
  role: string;
}

export interface SupportMessage {
  id: string;
  authorType: SupportMessageAuthor;
  body: string;
  createdAt: string;
  admin: SupportAdminRef | null;
}

export interface SupportEscalation {
  id: string;
  ticketId: string;
  target: SupportEscalationTarget;
  reason: string;
  status: SupportEscalationStatus;
  notes: string | null;
  createdAt: string;
  resolvedAt: string | null;
  createdBy: SupportAdminRef;
  handledBy: SupportAdminRef | null;
  ticket?: {
    id: string;
    subject: string;
    category: SupportTicketCategory;
    priority: SupportTicketPriority;
    status: SupportTicketStatus;
    user: UserRef | null;
  };
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  user: UserRef | null;
  assignedTo: SupportAdminRef | null;
  createdBy: SupportAdminRef | null;
  lastMessage?: { body: string; authorType: SupportMessageAuthor; createdAt: string } | null;
  slaHours?: number;
  slaDueAt?: string;
  slaBreached?: boolean;
  messages?: SupportMessage[];
  escalations?: SupportEscalation[];
  _count?: { messages: number; escalations: number };
}

export interface SupportStats {
  open: number;
  inProgress: number;
  escalated: number;
  waiting: number;
  resolvedToday: number;
}

export async function getSupportStats(): Promise<SupportStats> {
  const { data } = await adminV1Client.get<{ data: SupportStats }>("/support/stats");
  return data.data;
}

export async function getSupportTickets(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  category?: string;
  search?: string;
  userId?: string;
  assignedToId?: string;
}): Promise<PaginatedResponse<SupportTicket>> {
  const { data } = await adminV1Client.get<PaginatedResponse<SupportTicket>>("/support/tickets", {
    params,
  });
  return data;
}

export async function getSupportTicket(id: string): Promise<SupportTicket> {
  const { data } = await adminV1Client.get<{ data: SupportTicket }>(`/support/tickets/${id}`);
  return data.data;
}

export async function createSupportTicket(input: {
  userId: string;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  body: string;
  asUser?: boolean;
}): Promise<SupportTicket> {
  const { data } = await adminV1Client.post<{ data: SupportTicket }>("/support/tickets", input);
  return data.data;
}

export async function updateSupportTicket(
  id: string,
  input: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    assignedToId?: string | null;
  },
): Promise<SupportTicket> {
  const { data } = await adminV1Client.patch<{ data: SupportTicket }>(`/support/tickets/${id}`, input);
  return data.data;
}

export async function sendSupportMessage(
  ticketId: string,
  input: { body: string; authorType: "user" | "agent" | "internal" },
): Promise<SupportTicket> {
  const { data } = await adminV1Client.post<{ data: SupportTicket }>(
    `/support/tickets/${ticketId}/messages`,
    input,
  );
  return data.data;
}

export async function escalateSupportTicket(
  ticketId: string,
  input: { target: SupportEscalationTarget; reason: string },
): Promise<SupportTicket> {
  const { data } = await adminV1Client.post<{ data: SupportTicket }>(
    `/support/tickets/${ticketId}/escalate`,
    input,
  );
  return data.data;
}

export async function getEscalations(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  target?: string;
}): Promise<PaginatedResponse<SupportEscalation>> {
  const { data } = await adminV1Client.get<PaginatedResponse<SupportEscalation>>(
    "/support/escalations",
    { params },
  );
  return data;
}

export async function updateEscalation(
  id: string,
  input: { status: SupportEscalationStatus; notes?: string },
) {
  const { data } = await adminV1Client.patch<{ data: SupportEscalation }>(
    `/support/escalations/${id}`,
    input,
  );
  return data.data;
}
