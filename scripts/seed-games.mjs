import { createClient } from "@libsql/client";

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_TOKEN;

if (!url || !authToken) {
  throw new Error("TURSO_URL and TURSO_TOKEN must be set");
}

const client = createClient({ url, authToken });

console.log("Connected to Turso:", url);

// Create the games table
await client.execute(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    listing_count INTEGER NOT NULL DEFAULT 0
  )
`);
console.log("✅ games table ready");

const GAMES = [
  { name: "Valorant", slug: "valorant" },
  { name: "CS2", slug: "cs2" },
  { name: "League of Legends", slug: "league-of-legends" },
  { name: "World of Warcraft", slug: "world-of-warcraft" },
  { name: "Diablo IV", slug: "diablo-iv" },
  { name: "Fortnite", slug: "fortnite" },
  { name: "Apex Legends", slug: "apex-legends" },
  { name: "Dota 2", slug: "dota-2" },
  { name: "Path of Exile", slug: "path-of-exile" },
  { name: "Final Fantasy XIV", slug: "final-fantasy-xiv" },
  { name: "Destiny 2", slug: "destiny-2" },
  { name: "Call of Duty", slug: "call-of-duty" },
  { name: "Overwatch 2", slug: "overwatch-2" },
  { name: "Elder Scrolls Online", slug: "elder-scrolls-online" },
  { name: "New World", slug: "new-world" },
  { name: "Lost Ark", slug: "lost-ark" },
  { name: "Elden Ring", slug: "elden-ring" },
  { name: "GTA V", slug: "gta-v" },
  { name: "Honor of Kings", slug: "honor-of-kings" },
  { name: "Arc Raiders", slug: "arc-raiders" },
  { name: "COD Mobile", slug: "cod-mobile" },
];

let inserted = 0;
let skipped = 0;

for (const game of GAMES) {
  try {
    await client.execute({
      sql: `INSERT OR IGNORE INTO games (name, slug) VALUES (?, ?)`,
      args: [game.name, game.slug],
    });
    const result = await client.execute({
      sql: `SELECT changes() as c`,
      args: [],
    });
    if (Number(result.rows[0].c) > 0) {
      inserted++;
      console.log(`  ✅ Added: ${game.name}`);
    } else {
      skipped++;
      console.log(`  ⏭  Already exists: ${game.name}`);
    }
  } catch (err) {
    console.error(`  ❌ Failed: ${game.name}`, err.message);
  }
}

console.log(`\nDone: ${inserted} inserted, ${skipped} skipped`);
client.close();
