// Minimal diagnostic function — no dependencies, no Express, no Clerk.
// If this returns 200 but /api/healthz fails, the issue is in our bundle.
// If this also fails, the issue is Vercel configuration.
module.exports = function ping(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      pong: true,
      ts: Date.now(),
      node: process.version,
      env: {
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? "set" : "MISSING",
        CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ? "set" : "MISSING",
        VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY ? "set" : "MISSING",
        TURSO_URL: process.env.TURSO_URL ? "set" : "MISSING",
        TURSO_TOKEN: process.env.TURSO_TOKEN ? "set" : "MISSING",
      },
    }),
  );
};

module.exports.config = { api: { bodyParser: false } };
