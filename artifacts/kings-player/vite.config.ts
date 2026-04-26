import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

// Compatible with Node.js 18+ (import.meta.dirname requires Node 21+)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PORT is only needed for dev/preview — not during `vite build`
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5173;

// BASE_PATH defaults to "/" (correct for Vercel and standalone deployments)
const basePath = process.env.BASE_PATH ?? "/";

const isReplit = process.env.REPL_ID !== undefined;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    // Replit-only plugins — skipped outside of Replit environment
    ...(isReplit
      ? [
          (await import("@replit/vite-plugin-runtime-error-modal")).default(),
          ...(process.env.NODE_ENV !== "production"
            ? [
                await import("@replit/vite-plugin-cartographer").then((m) =>
                  m.cartographer({
                    root: path.resolve(__dirname, ".."),
                  }),
                ),
                await import("@replit/vite-plugin-dev-banner").then((m) =>
                  m.devBanner(),
                ),
              ]
            : []),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "../../public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
