import { z } from "zod";

export const listReportsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]).optional(),
  type: z.enum(["user", "media", "message", "profile"]).optional(),
});

export const updateReportSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
  note: z.string().max(1000).optional(),
});

export type ListReportsInput = z.infer<typeof listReportsSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
