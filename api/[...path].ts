/**
 * Vercel Serverless Function — catch-all for all /api/* routes
 */
import type { IncomingMessage, ServerResponse } from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

let appPromise: Promise<(req: IncomingMessage, res: ServerResponse) => void> | null = null;

function getApp() {
  if (!appPromise) {
    appPromise = import("../artifacts/api-server/src/app").then(
      (m) => m.default as any
    );
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[api/[...path]] startup error:", stack ?? message);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message, stack }));
  }
}
