/**
 * Vercel Serverless Function — /api/* catch-all
 *
 * Uses lazy dynamic import so ANY module-load error is caught and returned
 * as a readable JSON body instead of a silent FUNCTION_INVOCATION_FAILED crash.
 */
export const config = {
  api: { bodyParser: false },
};

type Handler = (req: any, res: any) => void;
let _app: Handler | null = null;
let _appError: Error | null = null;

async function loadApp(): Promise<Handler> {
  if (_appError) throw _appError;
  if (_app) return _app;

  try {
    const mod = await import("../artifacts/api-server/src/app");
    _app = mod.default as Handler;
    return _app;
  } catch (err: any) {
    _appError = err instanceof Error ? err : new Error(String(err));
    throw _appError;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const app = await loadApp();
    app(req, res);
  } catch (err: any) {
    const message: string = err?.message ?? String(err);
    const stack: string | undefined = err?.stack;
    console.error("[api/index] crash:", stack ?? message);
    // Always respond — prevents Vercel showing its own crash page
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message, stack }));
  }
}
