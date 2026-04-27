/**
 * Entry point for the Vercel serverless function bundle.
 * This file is compiled by scripts/build-vercel-function.mjs into api/index.js.
 * It is NOT deployed directly — only its compiled output is.
 */
import app from "../artifacts/api-server/src/app";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;
