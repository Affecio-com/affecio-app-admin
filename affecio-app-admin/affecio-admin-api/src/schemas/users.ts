import { z } from "zod";

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  accountStatus: z.enum(["active", "suspended", "banned"]).optional(),
  activityStatus: z.enum(["active", "recent", "inactive", "dormant"]).optional(),
  hasOpenReports: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  phoneNumber: z.string().min(8).max(20),
  email: z.email().optional().nullable(),
  gender: z.string().min(1).max(50),
  birthday: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  lookingFor: z.array(z.string()).default([]),
  aboutMe: z.string().max(500).optional().nullable(),
  startConversation: z.string().max(200).optional().nullable(),
  comfortableWith: z.string().max(200).optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.email().optional().nullable(),
  phoneNumber: z.string().min(8).max(20).optional(),
  gender: z.string().min(1).max(50).optional(),
  aboutMe: z.string().max(500).optional().nullable(),
  startConversation: z.string().max(200).optional().nullable(),
  comfortableWith: z.string().max(200).optional().nullable(),
  lookingFor: z.array(z.string()).optional(),
  accountStatus: z.enum(["active", "suspended", "banned"]).optional(),
  statusReason: z.string().max(500).optional().nullable(),
  adminNotes: z.string().max(2000).optional().nullable(),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type ActivityStatus = "active" | "recent" | "inactive" | "dormant";
export type AccountStatus = "active" | "suspended" | "banned";
