import { Router } from "express";
import { listUsersSchema, updateUserSchema } from "../schemas/users";
import * as userAdminService from "../services/userAdminService";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";
import { getRouteParam } from "../lib/params";

const router = Router();

router.use(requireAdminAuth);

router.get("/", requireRole("super_admin", "admin", "moderator", "support", "marketing"), async (req, res) => {
  const parsed = listUsersSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query parameters" });
    return;
  }
  const result = await userAdminService.listUsers(parsed.data);
  res.json(result);
});

router.get("/:id", requireRole("super_admin", "admin", "moderator", "support", "marketing"), async (req, res) => {
  const user = await userAdminService.getUserById(getRouteParam(req.params.id));
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ data: user });
});

router.patch(
  "/:id",
  requireRole("super_admin", "admin", "moderator"),
  auditAction("user.update", "user", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid update payload" });
      return;
    }
    const user = await userAdminService.updateUser(getRouteParam(req.params.id), parsed.data);
    res.json({ data: user });
  },
);

export default router;
