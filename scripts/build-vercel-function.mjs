/**
 * Pre-compiles the Express API app into a self-contained CJS bundle
 * at api/index.js before Vercel bundles the serverless function.
 *
 * WHY: Vercel's bundler cannot follow pnpm workspace symlinks
 * (@workspace/db, @workspace/api-zod etc.), causing FUNCTION_INVOCATION_FAILED.
 * By running this script in the Vercel buildCommand, we resolve all workspace
 * imports ourselves (via esbuild's symlink following) and output plain JavaScript
 * that Vercel can handle without any workspace knowledge.
 */
import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

await build({
  entryPoints: [path.join(root, "scripts/vercel-entry.ts")],
  platform: "node",
  bundle: true,
  format: "cjs",
  outfile: path.join(root, "api/index.js"),
  external: [
    // Native .node addons can never be bundled
    "*.node",
    // libsql is a native Rust binary — we use @libsql/client/http instead
    // (pure HTTP fetch, no native code). Externalizing prevents bundling the
    // sqlite3 code path that libsql is needed for. It will never be called
    // at runtime because we always use HTTPS URLs.
    "libsql",
    "@libsql/linux-x64-gnu",
    "@libsql/linux-x64-musl",
    "@libsql/darwin-x64",
    "@libsql/darwin-arm64",
    "@libsql/win32-x64-msvc",
  ],
  logLevel: "info",
});

console.log("✓ api/index.js built successfully");
