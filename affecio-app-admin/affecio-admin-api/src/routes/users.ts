import { Router } from "express";
import {
  createUserSchema,
  enforceUserSchema,
  hideMediaSchema,
  listUsersSchema,
  updateUserSchema,
  userNoteSchema,
} from "../schemas/users";
import * as userAdminService from "../services/userAdminService";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";
import { getRouteParam } from "../lib/params";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

router.use(requireAdminAuth);

const readRoles = ["super_admin", "admin", "moderator", "support", "developer"] as const;
const writeRoles = ["super_admin", "admin", "moderator"] as const;
const enforceRoles = ["super_admin", "admin", "moderator"] as const;
const noteRoles = ["super_admin", "admin", "moderator", "support"] as const;
const deleteRoles = ["super_admin", "admin"] as const;

router.get("/", requireRole(...readRoles), rateLimit(120, 60_000), async (req, res) => {
  const parsed = listUsersSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query parameters" });
    return;
  }
  const result = await userAdminService.listUsers(parsed.data);
  res.json(result);
});

router.post(
  "/",
  requireRole(...writeRoles),
  rateLimit(20, 60_000),
  auditAction("user.create", "user", (req) => req.body.phoneNumber ?? "new"),
  async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid user payload", errors: parsed.error.flatten() });
      return;
    }
    try {
      const user = await userAdminService.createUser(parsed.data);
      res.status(201).json({ data: user });
    } catch (err) {
      const message = err instanceof Error && err.message.includes("Unique constraint")
        ? "Phone number or email already in use."
        : "Failed to create user.";
      res.status(400).json({ message });
    }
  },
);

router.get("/:id", requireRole(...readRoles), async (req, res) => {
  const user = await userAdminService.getUserById(getRouteParam(req.params.id));
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ data: user });
});

router.patch(
  "/:id",
  requireRole(...writeRoles),
  rateLimit(40, 60_000),
  auditAction("user.update", "user", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid update payload" });
      return;
    }
    try {
      const user = await userAdminService.updateUser(
        getRouteParam(req.params.id),
        parsed.data,
        req.admin!.id,
      );
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({ data: user });
    } catch {
      res.status(400).json({ message: "Failed to update user." });
    }
  },
);

router.post(
  "/:id/enforce",
  requireRole(...enforceRoles),
  rateLimit(20, 60_000),
  auditAction("user.enforce", "user", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    const parsed = enforceUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Action and reason are required." });
      return;
    }
    const user = await userAdminService.enforceUser(
      getRouteParam(req.params.id),
      parsed.data.action,
      parsed.data.reason,
      req.admin!.id,
    );
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json({ data: user });
  },
);

router.post(
  "/:id/notes",
  requireRole(...noteRoles),
  rateLimit(40, 60_000),
  auditAction("user.note", "user", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    const parsed = userNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Note is required." });
      return;
    }
    const user = await userAdminService.addUserNote(
      getRouteParam(req.params.id),
      parsed.data.body,
      req.admin!.id,
    );
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(201).json({ data: user });
  },
);

router.patch(
  "/:id/media/:mediaId",
  requireRole(...enforceRoles),
  rateLimit(30, 60_000),
  auditAction("user.media", "user", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    const parsed = hideMediaSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid media update" });
      return;
    }
    const user = await userAdminService.setMediaHidden(
      getRouteParam(req.params.id),
      getRouteParam(req.params.mediaId),
      parsed.data.hidden,
      req.admin!.id,
    );
    if (!user) {
      res.status(404).json({ message: "Media not found" });
      return;
    }
    res.json({ data: user });
  },
);

router.delete(
  "/:id",
  requireRole(...deleteRoles),
  rateLimit(10, 60_000),
  auditAction("user.delete", "user", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    try {
      await userAdminService.deleteUser(getRouteParam(req.params.id));
      res.json({ data: { deleted: true } });
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
      if (code === "NOT_FOUND" || code === "P2025") {
        res.status(404).json({ message: "User not found." });
        return;
      }
      console.error("deleteUser failed:", err);
      res.status(500).json({
        message: "Could not delete user. Check server logs or retry after resolving related data.",
      });
    }
  },
);

export default router;
