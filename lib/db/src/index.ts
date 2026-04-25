import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

if (!process.env.TURSO_URL) {
  throw new Error("TURSO_URL must be set.");
}
if (!process.env.TURSO_TOKEN) {
  throw new Error("TURSO_TOKEN must be set.");
}

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

export const db = drizzle(client, { schema });

export * from "./schema";
