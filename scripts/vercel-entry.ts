import type { IncomingMessage, ServerResponse } from "http";
import app from "../artifacts/api-server/src/app";

function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    return (app as any)(req, res);
  } catch (err: any) {
    console.error("[vercel-entry] Sync handler error:", err?.stack || err?.message);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: err?.message ?? "Unknown error",
          stack: err?.stack ?? null,
        }),
      );
    }
  }
}

(handler as any).config = { api: { bodyParser: false } };

// Set module.exports directly for maximum Vercel CJS compatibility.
// Some versions of @vercel/node look for module.exports rather than exports.default.
// We set both to be safe.
export default handler;
