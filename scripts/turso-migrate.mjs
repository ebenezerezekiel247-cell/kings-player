import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_TOKEN;

if (!url || !authToken) {
  throw new Error("TURSO_URL and TURSO_TOKEN must be set");
}

const client = createClient({ url, authToken });

console.log("Connected to Turso:", url);

// Step 2: Create tables
console.log("\n--- Creating tables in Turso ---");

await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clerk_id TEXT NOT NULL UNIQUE,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    discord_username TEXT,
    listing_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    game_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT NOT NULL,
    game TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    discord_username TEXT NOT NULL,
    seller_clerk_id TEXT NOT NULL,
    seller_username TEXT,
    seller_avatar_url TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    author_clerk_id TEXT NOT NULL,
    author_username TEXT,
    author_avatar_url TEXT,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log("✅ All tables created");

// Step 3: Import data from replit_backup.json
console.log("\n--- Importing data from replit_backup.json ---");

const backup = JSON.parse(readFileSync("replit_backup.json", "utf8"));

// Import categories
const categories = backup.categories || [];
let catCount = 0;
for (const row of categories) {
  await client.execute({
    sql: `INSERT OR REPLACE INTO categories (id, name, slug, game_count) VALUES (?, ?, ?, ?)`,
    args: [row.id, row.name, row.slug, row.game_count ?? 0],
  });
  catCount++;
}
console.log(`  ✅ Imported ${catCount} categories`);

// Import users
const users = backup.users || [];
let userCount = 0;
for (const row of users) {
  await client.execute({
    sql: `INSERT OR REPLACE INTO users (id, clerk_id, username, avatar_url, bio, discord_username, listing_count, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      row.id,
      row.clerk_id,
      row.username ?? null,
      row.avatar_url ?? null,
      row.bio ?? null,
      row.discord_username ?? null,
      row.listing_count ?? 0,
      row.created_at ?? new Date().toISOString(),
      row.updated_at ?? new Date().toISOString(),
    ],
  });
  userCount++;
}
console.log(`  ✅ Imported ${userCount} users`);

// Import listings
const listings = backup.listings || [];
let listingCount = 0;
for (const row of listings) {
  await client.execute({
    sql: `INSERT OR REPLACE INTO listings
          (id, title, description, price, game, category, image_url, discord_username,
           seller_clerk_id, seller_username, seller_avatar_url, view_count, comment_count,
           status, featured, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      row.id,
      row.title,
      row.description,
      row.price,
      row.game,
      row.category,
      row.image_url ?? null,
      row.discord_username,
      row.seller_clerk_id,
      row.seller_username ?? null,
      row.seller_avatar_url ?? null,
      row.view_count ?? 0,
      row.comment_count ?? 0,
      row.status ?? "active",
      row.featured ? 1 : 0,
      row.created_at ?? new Date().toISOString(),
      row.updated_at ?? new Date().toISOString(),
    ],
  });
  listingCount++;
}
console.log(`  ✅ Imported ${listingCount} listings`);

// Import comments
const comments = backup.comments || [];
let commentCount = 0;
for (const row of comments) {
  await client.execute({
    sql: `INSERT OR REPLACE INTO comments
          (id, listing_id, author_clerk_id, author_username, author_avatar_url, content, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      row.id,
      row.listing_id,
      row.author_clerk_id,
      row.author_username ?? null,
      row.author_avatar_url ?? null,
      row.content,
      row.created_at ?? new Date().toISOString(),
    ],
  });
  commentCount++;
}
console.log(`  ✅ Imported ${commentCount} comments`);

// Step 5: Verify
console.log("\n--- Verifying row counts in Turso ---");
const tables = ["users", "categories", "listings", "comments"];
for (const table of tables) {
  const result = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
  console.log(`  ${table}: ${result.rows[0].count} rows`);
}

console.log("\n✅ Migration complete!");
client.close();
