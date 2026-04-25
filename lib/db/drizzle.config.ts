import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.TURSO_URL) {
  throw new Error("TURSO_URL must be set");
}
if (!process.env.TURSO_TOKEN) {
  throw new Error("TURSO_TOKEN must be set");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
  },
});
