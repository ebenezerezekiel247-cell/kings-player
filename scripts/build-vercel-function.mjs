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
 * All packages imported by vercel-entry.ts are declared as devDependencies in
 * the ROOT package.json, so they are available at node_modules/ after pnpm install
 * regardless of which workspace package also declares them.
 *
 * The footer ensures module.exports IS the handler function (not an object with
 * a .default property), which is required by @vercel/node's CJS calling convention.
 * Note: we must check module.exports.default (not exports.default) because esbuild
 * runs `module.exports = __toCommonJS(...)` which detaches exports from module.exports.
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
  // All required packages are in root node_modules/ (declared in root package.json).
  // No custom nodePaths needed.
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
      "// Vercel @vercel/node CJS compat: expose handler as module.exports directly.",
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
