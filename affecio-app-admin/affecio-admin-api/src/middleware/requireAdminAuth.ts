import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyAdminToken } from "../lib/jwt";

const ACTIVITY_THROTTLE_MS = 60_000;
const lastTouch = new Map<string, number>();

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = header.slice(7);
  void (async () => {
    try {
      const payload = verifyAdminToken(token);
      const admin = await prisma.adminUser.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, tokenVersion: true, lockedUntil: true, disabledAt: true },
      });

      if (!admin || admin.disabledAt) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
      }

      if (admin.lockedUntil && admin.lockedUntil > new Date()) {
        res.status(423).json({ message: "Account locked. Try again later." });
        return;
      }

      if ((payload.tv ?? 0) !== admin.tokenVersion) {
        res.status(401).json({ message: "Session revoked. Sign in again." });
        return;
      }

      req.admin = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      };

      const now = Date.now();
      const prev = lastTouch.get(admin.id) ?? 0;
      if (now - prev > ACTIVITY_THROTTLE_MS) {
        lastTouch.set(admin.id, now);
        void prisma.adminUser
          .update({
            where: { id: admin.id },
            data: { lastActivityAt: new Date() },
          })
          .catch(() => undefined);
      }

      next();
    } catch {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  })();
}
