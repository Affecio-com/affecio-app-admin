import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin", "admin", "moderator"));

router.get("/", (_req, res) => {
  res.json({ data: [], message: "Calls endpoint scaffold ready" });
});

export default router;
