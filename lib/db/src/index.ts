import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

function createDb() {
  if (!process.env.TURSO_URL) {
    throw new Error("TURSO_URL env var is not set");
  }
  if (!process.env.TURSO_TOKEN) {
    throw new Error("TURSO_TOKEN env var is not set");
  }

  const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
  });

  return drizzle(client, { schema });
}

// Lazy singleton — initialized on first use, not at module load time.
// This prevents the Vercel function from crashing at startup if env vars
// are read before the runtime environment injects them.
let _db: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    return (_db as any)[prop];
  },
});

export * from "./schema";
