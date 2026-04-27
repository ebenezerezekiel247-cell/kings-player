/**
 * Vercel Serverless Function — all /api/* routes handled by Express
 *
 * vercel.json routes every /api/(.*) request here so Express sees the
 * full URL (e.g. /api/listings) and routes it through app.use("/api", router).
 */
import app from "../artifacts/api-server/src/app";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;
