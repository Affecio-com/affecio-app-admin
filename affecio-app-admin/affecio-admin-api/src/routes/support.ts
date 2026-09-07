import { Router } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin", "admin", "support"));

router.get("/notes", (_req, res) => {
  res.json({ data: [], message: "Support notes endpoint scaffold ready" });
});

router.post("/recovery", (_req, res) => {
  res.json({ message: "Account recovery endpoint scaffold ready" });
});

export default router;
