import { createClient } from "@libsql/client";

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_TOKEN;

if (!url || !authToken) {
  throw new Error("TURSO_URL and TURSO_TOKEN must be set");
}

const client = createClient({ url, authToken });

console.log("Connected to Turso:", url);

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
  // ── PC / MMO ──
  { name: "Valorant", slug: "valorant" },
  { name: "CS2", slug: "cs2" },
  { name: "League of Legends", slug: "league-of-legends" },
  { name: "Dota 2", slug: "dota-2" },
  { name: "World of Warcraft", slug: "world-of-warcraft" },
  { name: "World of Warcraft Classic", slug: "wow-classic" },
  { name: "Final Fantasy XIV", slug: "final-fantasy-xiv" },
  { name: "Diablo IV", slug: "diablo-iv" },
  { name: "Diablo III", slug: "diablo-iii" },
  { name: "Path of Exile", slug: "path-of-exile" },
  { name: "Path of Exile 2", slug: "path-of-exile-2" },
  { name: "Lost Ark", slug: "lost-ark" },
  { name: "New World: Aeternum", slug: "new-world" },
  { name: "Elder Scrolls Online", slug: "elder-scrolls-online" },
  { name: "Black Desert Online", slug: "black-desert-online" },
  { name: "Albion Online", slug: "albion-online" },
  { name: "RuneScape", slug: "runescape" },
  { name: "Old School RuneScape", slug: "old-school-runescape" },
  { name: "Throne and Liberty", slug: "throne-and-liberty" },
  { name: "Lineage W", slug: "lineage-w" },
  { name: "MapleStory", slug: "maplestory" },
  { name: "Ragnarok Online", slug: "ragnarok-online" },
  { name: "Guild Wars 2", slug: "guild-wars-2" },
  { name: "Star Wars: The Old Republic", slug: "swtor" },
  { name: "Neverwinter", slug: "neverwinter" },
  { name: "Blade & Soul", slug: "blade-and-soul" },
  { name: "Aion", slug: "aion" },
  { name: "Perfect World", slug: "perfect-world" },
  { name: "Mu Online", slug: "mu-online" },

  // ── PC / Battle Royale & Shooter ──
  { name: "Fortnite", slug: "fortnite" },
  { name: "Apex Legends", slug: "apex-legends" },
  { name: "PUBG: Battlegrounds", slug: "pubg" },
  { name: "Overwatch 2", slug: "overwatch-2" },
  { name: "Destiny 2", slug: "destiny-2" },
  { name: "Warframe", slug: "warframe" },
  { name: "Tom Clancy's Rainbow Six Siege", slug: "r6-siege" },
  { name: "Hunt: Showdown 1896", slug: "hunt-showdown" },
  { name: "Escape from Tarkov", slug: "escape-from-tarkov" },
  { name: "DayZ", slug: "dayz" },
  { name: "Rust", slug: "rust" },
  { name: "ARK: Survival Evolved", slug: "ark-survival-evolved" },
  { name: "ARK: Survival Ascended", slug: "ark-survival-ascended" },
  { name: "The Division 2", slug: "the-division-2" },
  { name: "Borderlands 3", slug: "borderlands-3" },
  { name: "Helldivers 2", slug: "helldivers-2" },
  { name: "Arc Raiders", slug: "arc-raiders" },

  // ── PC / MOBA & Strategy ──
  { name: "Heroes of the Storm", slug: "heroes-of-the-storm" },
  { name: "Smite 2", slug: "smite-2" },
  { name: "Predecessor", slug: "predecessor" },

  // ── PC / Action & RPG ──
  { name: "GTA V", slug: "gta-v" },
  { name: "GTA VI", slug: "gta-vi" },
  { name: "Elden Ring", slug: "elden-ring" },
  { name: "Dark Souls III", slug: "dark-souls-iii" },
  { name: "Monster Hunter: World", slug: "monster-hunter-world" },
  { name: "Monster Hunter Wilds", slug: "monster-hunter-wilds" },
  { name: "Red Dead Redemption 2", slug: "rdr2" },
  { name: "Cyberpunk 2077", slug: "cyberpunk-2077" },
  { name: "Baldur's Gate 3", slug: "baldurs-gate-3" },

  // ── PC / Card & Other ──
  { name: "Hearthstone", slug: "hearthstone" },
  { name: "Legends of Runeterra", slug: "legends-of-runeterra" },
  { name: "Teamfight Tactics", slug: "teamfight-tactics" },
  { name: "VALORANT: The Game (Mobile)", slug: "valorant-mobile" },
  { name: "Minecraft", slug: "minecraft" },
  { name: "Roblox", slug: "roblox" },
  { name: "Steam Account", slug: "steam-account" },

  // ── Mobile ──
  { name: "PUBG Mobile", slug: "pubg-mobile" },
  { name: "COD Mobile", slug: "cod-mobile" },
  { name: "Free Fire", slug: "free-fire" },
  { name: "Mobile Legends: Bang Bang", slug: "mobile-legends" },
  { name: "Honor of Kings", slug: "honor-of-kings" },
  { name: "Clash of Clans", slug: "clash-of-clans" },
  { name: "Clash Royale", slug: "clash-royale" },
  { name: "Brawl Stars", slug: "brawl-stars" },
  { name: "Genshin Impact", slug: "genshin-impact" },
  { name: "Honkai: Star Rail", slug: "honkai-star-rail" },
  { name: "Zenless Zone Zero", slug: "zenless-zone-zero" },
  { name: "Wuthering Waves", slug: "wuthering-waves" },
  { name: "Pokémon GO", slug: "pokemon-go" },
  { name: "Wild Rift", slug: "wild-rift" },
  { name: "Arena of Valor", slug: "arena-of-valor" },
  { name: "Garena AOV", slug: "garena-aov" },
  { name: "Magic: The Gathering Arena", slug: "mtg-arena" },
  { name: "Diablo Immortal", slug: "diablo-immortal" },
  { name: "Ragnarok X: Next Generation", slug: "ragnarok-x" },
  { name: "Rise of Kingdoms", slug: "rise-of-kingdoms" },
  { name: "State of Survival", slug: "state-of-survival" },
  { name: "Lords Mobile", slug: "lords-mobile" },
  { name: "Game of Sultans", slug: "game-of-sultans" },
  { name: "AFK Journey", slug: "afk-journey" },
  { name: "Coin Master", slug: "coin-master" },
  { name: "Stumble Guys", slug: "stumble-guys" },
  { name: "Among Us", slug: "among-us" },

  // ── Console ──
  { name: "FIFA 25", slug: "fifa-25" },
  { name: "FC 25", slug: "fc-25" },
  { name: "NBA 2K25", slug: "nba-2k25" },
  { name: "Madden NFL 25", slug: "madden-25" },
  { name: "Call of Duty: Warzone", slug: "warzone" },
  { name: "Call of Duty: Black Ops 6", slug: "bo6" },
  { name: "God of War: Ragnarök", slug: "god-of-war-ragnarok" },
  { name: "Spider-Man 2", slug: "spiderman-2" },
  { name: "The Last of Us Part II", slug: "tlou2" },
  { name: "Hogwarts Legacy", slug: "hogwarts-legacy" },
  { name: "Diablo IV (Console)", slug: "diablo-iv-console" },
  { name: "Mortal Kombat 1", slug: "mk1" },
  { name: "Street Fighter 6", slug: "street-fighter-6" },
  { name: "Tekken 8", slug: "tekken-8" },
  { name: "Dragon Ball: Sparking! Zero", slug: "sparking-zero" },
  { name: "Xbox Game Pass Account", slug: "xbox-game-pass" },
  { name: "PlayStation Network Account", slug: "psn-account" },

  // ── Other ──
  { name: "Other", slug: "other" },
];

let inserted = 0;
let skipped = 0;

for (const game of GAMES) {
  try {
    await client.execute({
      sql: `INSERT OR IGNORE INTO games (name, slug) VALUES (?, ?)`,
      args: [game.name, game.slug],
    });
    const result = await client.execute({ sql: `SELECT changes() as c`, args: [] });
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

console.log(`\nDone: ${inserted} inserted, ${skipped} skipped — total ${GAMES.length} games`);
client.close();
