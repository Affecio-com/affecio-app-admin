import type { NextFunction, Request, Response } from "express";
import { clientIp } from "../lib/requestMeta";

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(maxRequests = 100, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${clientIp(req)}:${req.method}:${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ message: "Too many requests. Try again later." });
      return;
    }

    entry.count += 1;
    next();
  };
}
