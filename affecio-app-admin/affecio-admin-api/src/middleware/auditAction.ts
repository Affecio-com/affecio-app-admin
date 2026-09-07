import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export function auditAction(action: string, targetType: string, getTargetId: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = ((body: unknown) => {
      if (res.statusCode < 400 && req.admin) {
        void prisma.auditLog
          .create({
            data: {
              adminId: req.admin.id,
              action,
              targetType,
              targetId: getTargetId(req),
              metadata: body as object,
            },
          })
          .catch(console.error);
      }
      return originalJson(body);
    }) as typeof res.json;

    next();
  };
}
