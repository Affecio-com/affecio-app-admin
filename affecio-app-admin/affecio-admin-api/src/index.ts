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

  for (const host of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]) {
    if (host) origins.push(`https://${host.replace(/^https?:\/\//, "")}`);
  }

  return [...new Set(origins)];
}

const allowedOrigins = parseCorsOrigins();

const adminCors = cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
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
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
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
