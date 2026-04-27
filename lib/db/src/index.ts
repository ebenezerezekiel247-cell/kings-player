// Use the HTTP-only client — no native Rust binaries, works in all serverless runtimes
import { createClient } from "@libsql/client/http";
// Use the HTTP-specific drizzle adapter to avoid pulling in drizzle-orm/libsql
// main entry which imports @libsql/client (full node.js) → sqlite3.js → libsql native binary.
import { drizzle } from "drizzle-orm/libsql/http";
import * as schema from "./schema";

function createDb() {
  if (!process.env.TURSO_URL) {
    throw new Error("TURSO_URL env var is not set");
  }
  if (!process.env.TURSO_TOKEN) {
    throw new Error("TURSO_TOKEN env var is not set");
  }

  // @libsql/client/http requires https:// — convert libsql:// if needed
  const url = process.env.TURSO_URL.replace(/^libsql:\/\//, "https://");

  const client = createClient({
    url,
    authToken: process.env.TURSO_TOKEN,
  });

  return drizzle(client, { schema });
}

// Lazy singleton — initialized on first use, not at module load time.
let _db: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    return (_db as any)[prop];
  },
});

export * from "./schema";
