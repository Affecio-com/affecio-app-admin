import type { AdminRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

export function requireRole(...allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    next();
  };
}
