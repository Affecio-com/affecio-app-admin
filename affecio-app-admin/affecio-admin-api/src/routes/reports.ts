import { Router } from "express";
import { listReportsSchema, updateReportSchema } from "../schemas/reports";
import * as reportService from "../services/reportService";
import { getRouteParam } from "../lib/params";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { requireRole } from "../middleware/requireRole";
import { auditAction } from "../middleware/auditAction";

const router = Router();

router.use(requireAdminAuth, requireRole("super_admin", "admin", "moderator"));

router.get("/", async (req, res) => {
  const parsed = listReportsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid query parameters" });
    return;
  }
  const result = await reportService.listReports(parsed.data);
  res.json(result);
});

router.get("/:id", async (req, res) => {
  const report = await reportService.getReportById(getRouteParam(req.params.id));
  if (!report) {
    res.status(404).json({ message: "Report not found" });
    return;
  }
  res.json({ data: report });
});

router.patch(
  "/:id",
  auditAction("report.update", "report", (req) => getRouteParam(req.params.id)),
  async (req, res) => {
    const parsed = updateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Invalid update payload" });
      return;
    }
    const report = await reportService.updateReport(getRouteParam(req.params.id), parsed.data);
    res.json({ data: report });
  },
);

export default router;
