import "dotenv/config";
import * as Sentry from "@sentry/node";

// Must initialize before express is imported (see index.ts import order)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}

export { Sentry };
