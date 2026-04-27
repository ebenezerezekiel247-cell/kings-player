/**
 * Vercel Serverless Function — Express backend
 *
 * Vercel auto-discovers any file in the /api directory as a serverless function.
 * Exporting the Express app directly works because Express implements the same
 * (req, res) handler interface that Vercel expects.
 *
 * All routes mounted at /api in the Express app are accessible here.
 * e.g. GET /api/listings, POST /api/users/me, etc.
 */
import app from "../artifacts/api-server/src/app";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default app;
