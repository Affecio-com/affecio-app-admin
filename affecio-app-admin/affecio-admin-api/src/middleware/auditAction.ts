import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { clientIp, clientUserAgent } from "../lib/requestMeta";

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
              targetId: String(getTargetId(req)).slice(0, 120),
              metadata: {
                ip: clientIp(req),
                userAgent: clientUserAgent(req),
                at: new Date().toISOString(),
              },
            },
          })
          .catch(console.error);
      }
      return originalJson(body);
    }) as typeof res.json;

    next();
  };
}

export async function writeAuthAudit(input: {
  adminId: string;
  action: string;
  req: Request;
}) {
  await prisma.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetType: "admin",
      targetId: input.adminId,
      metadata: {
        ip: clientIp(input.req),
        userAgent: clientUserAgent(input.req),
        at: new Date().toISOString(),
      },
    },
  });
}
