import "./instrument";
import cors from "cors";
import express from "express";
import { Sentry } from "./instrument";
import routes from "./routes";

const app = express();
const PORT = process.env.PORT ?? 4001;

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/api", routes);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

Sentry.setupExpressErrorHandler(app);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Affecio Admin API running on http://localhost:${PORT}`);
});

export default app;
