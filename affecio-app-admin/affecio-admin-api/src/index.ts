import "./instrument";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Sentry } from "./instrument";
import routes from "./routes";

const app = express();
const PORT = process.env.PORT ?? 4001;

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const origins = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  for (const host of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    if (!host) continue;
    const normalized = host.replace(/^https?:\/\//, "");
    origins.push(`https://${normalized}`);
    if (!normalized.startsWith("www.")) {
      origins.push(`https://www.${normalized}`);
    }
  }

  return [...new Set(origins)];
}

const allowedOrigins = parseCorsOrigins();

function isAllowedBrowserOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (hostname.endsWith(".vercel.app") || hostname.endsWith(".vercel.sh")) return true;
  } catch {
    return false;
  }
  return false;
}

const adminCors = cors({
  origin(origin, callback) {
    if (!origin || isAllowedBrowserOrigin(origin)) {
      callback(null, true);
      return;
    }
    console.warn("CORS rejected origin:", origin, "allowed:", allowedOrigins);
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,
});

const publicStatusCors = cors({
  origin: true,
  credentials: true,
  methods: ["GET", "OPTIONS"],
  maxAge: 600,
});

app.use((req, res, next) => {
  if (req.path === "/api/status") {
    publicStatusCors(req, res, next);
    return;
  }
  adminCors(req, res, next);
});
app.use(express.json({ limit: "64kb" }));

app.use("/api", routes);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

Sentry.setupExpressErrorHandler(app);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API error:", err);
  if (res.headersSent) return;
  const isCors = err.message.includes("CORS");
  res.status(isCors ? 403 : 500).json({
    message: isCors ? "Origin not allowed" : "Internal server error",
  });
});

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    const publicUrl = process.env.RENDER_EXTERNAL_URL;
    console.log(
      publicUrl
        ? `Affecio Admin API running at ${publicUrl}/api (CORS: ${allowedOrigins.join(", ")})`
        : `Affecio Admin API running on http://localhost:${PORT}/api (CORS: ${allowedOrigins.join(", ")})`,
    );
  });
}

export default app;
