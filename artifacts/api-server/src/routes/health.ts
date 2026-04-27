import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({
    status: "ok",
    env: {
      TURSO_URL: process.env.TURSO_URL ? "set" : "MISSING",
      TURSO_TOKEN: process.env.TURSO_TOKEN ? "set" : "MISSING",
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? "set" : "MISSING",
      NODE_ENV: process.env.NODE_ENV ?? "undefined",
      NODE_VERSION: process.version,
    },
  });
});

export default router;
