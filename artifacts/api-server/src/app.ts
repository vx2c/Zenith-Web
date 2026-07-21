import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  (pinoHttp as unknown as any)({
    logger,
    serializers: {
      req(req: Request) {
        return {
          id: (req as any).id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: Response) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Build explicit allow-list from Replit domain env vars (set at runtime).
// Falls back to localhost for local dev only.
const rawDomains = [
  process.env.REPLIT_DOMAINS,        // comma-separated production domains
  process.env.REPLIT_DEV_DOMAIN,     // single dev-preview domain
].filter(Boolean).join(",");

const allowedOrigins: Set<string> = new Set(
  rawDomains
    ? rawDomains.split(",").flatMap((d) => [
        `https://${d.trim()}`,
        `http://${d.trim()}`,
      ])
    : ["http://localhost:5173", "http://localhost:3000"],
);

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests (e.g. SSR, curl) have no Origin header — allow them.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware using PostgreSQL store
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  logger.error("SESSION_SECRET environment variable is required but not set. Shutting down.");
  process.exit(1);
}

const PgSession = ConnectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  }),
);

app.use("/api", router);

export default app;
