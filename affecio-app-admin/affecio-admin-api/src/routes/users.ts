import { Router } from "express";
import { createUserSchema, listUsersSchema, updateUserSchema } from "../schemas/users";
import * as userAdminService from "../services/userAdminService";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";
import { getRouteParam } from "../lib/params";

const router = Router();

router.use(requireAdminAuth);

const readRoles = ["super_admin", "admin", "moderator", "support", "marketing"] as const;
const writeRoles = ["super_admin", "admin", "moderator"] as const;
const deleteRoles = ["super_admin", "admin"] as const;

router.get("/", requireRole(...readRoles), async (req, res) => {
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

router.delete(
  "/:id",
  requireRole(...deleteRoles),
  auditAction("user.delete", "user", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    try {
      await userAdminService.deleteUser(getRouteParam(req.params.id));
      res.json({ data: { deleted: true } });
    } catch {
      res.status(404).json({ message: "User not found or could not be deleted." });
    }
  },
);

export default router;
