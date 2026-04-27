/**
 * Minimal diagnostic endpoint — no workspace imports.
 * Hit /api/ping to verify the function runtime is alive.
 */
export default function handler(_req: any, res: any) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      ok: true,
      node: process.version,
      env: {
        TURSO_URL: process.env.TURSO_URL ? "set" : "MISSING",
        TURSO_TOKEN: process.env.TURSO_TOKEN ? "set" : "MISSING",
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? "set" : "MISSING",
        NODE_ENV: process.env.NODE_ENV,
      },
    })
  );
}
