import pino from "pino";

// Never use pino transports (pino-pretty etc.) in a serverless/bundled context.
// Transports spawn worker threads that look for the transport module on disk —
// which doesn't exist after esbuild bundles everything into a single file.
// Plain JSON to stdout always works.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
});
