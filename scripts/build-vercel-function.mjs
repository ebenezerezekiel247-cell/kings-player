/**
 * Pre-compiles the Express API app into a self-contained CJS bundle
 * at api/index.js before Vercel bundles the serverless function.
 *
 * WHY: Vercel cannot resolve pnpm workspace symlinks (@workspace/db etc.).
 * We bundle everything ourselves with esbuild, then output plain JS for Vercel.
 *
 * The entry file (scripts/vercel-entry.ts) is fully self-contained — it does NOT
 * import from any @workspace/* packages. All schema/route logic is inlined.
 *
 * nodePaths tells esbuild where pnpm installed each package in the workspace,
 * since pnpm does not hoist everything to the root node_modules.
 *
 * The footer ensures module.exports IS the handler function (not an object with
 * a .default property), which is required by @vercel/node's CJS calling convention.
 */
import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

await build({
  entryPoints: [path.join(root, "scripts/vercel-entry.ts")],
  platform: "node",
  target: "node18",
  bundle: true,
  format: "cjs",
  outfile: path.join(root, "api/index.js"),
  // pnpm does not hoist packages to the root; we must tell esbuild exactly
  // where each workspace package installed its dependencies.
  nodePaths: [
    // express, cors, @clerk/express, drizzle-orm, pino, pino-http live here
    path.join(root, "artifacts/api-server/node_modules"),
    // zod lives here (declared by lib/api-zod)
    path.join(root, "lib/api-zod/node_modules"),
    // @libsql/client lives here (declared by lib/db)
    path.join(root, "lib/db/node_modules"),
    // fallback: root node_modules for anything hoisted
    path.join(root, "node_modules"),
  ],
  external: [
    // Native .node addons can never be bundled
    "*.node",
    // libsql native Rust binaries — we use @libsql/client/http (pure HTTP) instead
    "libsql",
    "@libsql/linux-x64-gnu",
    "@libsql/linux-x64-musl",
    "@libsql/linux-arm64-gnu",
    "@libsql/linux-arm64-musl",
    "@libsql/darwin-x64",
    "@libsql/darwin-arm64",
    "@libsql/win32-x64-msvc",
  ],
  // After esbuild CJS output, make module.exports the handler function itself.
  // esbuild runs `module.exports = __toCommonJS(exports_obj)` which detaches
  // `exports` from `module.exports`. So we must check module.exports.default,
  // NOT exports.default. @vercel/node calls module.exports(req, res) directly.
  footer: {
    js: [
      "// Vercel @vercel/node CJS compatibility: expose handler as module.exports directly.",
      "if (module.exports && typeof module.exports['default'] === 'function') {",
      "  var _h = module.exports['default'];",
      "  _h.config = module.exports.config || { api: { bodyParser: false } };",
      "  _h.default = _h;",
      "  module.exports = _h;",
      "}",
    ].join("\n"),
  },
  logLevel: "info",
});

console.log("✓ api/index.js built successfully");
