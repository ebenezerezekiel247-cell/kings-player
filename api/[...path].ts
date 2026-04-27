/**
 * Vercel Serverless Function — catch-all for all /api/* routes
 *
 * Using [...path] so Vercel explicitly routes every /api/anything request
 * here instead of relying on directory-index inference.
 */
import app from "../artifacts/api-server/src/app";

export const config = {
  api: {
    bodyParser: false, // Express handles its own body parsing
  },
};

export default app;
