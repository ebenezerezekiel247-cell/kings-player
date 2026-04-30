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

// Alphabetically sorted master list
const GAMES = [
  { name: "AFK Journey", slug: "afk-journey" },
  { name: "Aion", slug: "aion" },
  { name: "Albion Online", slug: "albion-online" },
  { name: "Among Us", slug: "among-us" },
  { name: "Apex Legends", slug: "apex-legends" },
  { name: "Arc Raiders", slug: "arc-raiders" },
  { name: "ARK: Survival Ascended", slug: "ark-survival-ascended" },
  { name: "ARK: Survival Evolved", slug: "ark-survival-evolved" },
  { name: "Arena of Valor", slug: "arena-of-valor" },
  { name: "Baldur's Gate 3", slug: "baldurs-gate-3" },
  { name: "Blade & Soul", slug: "blade-and-soul" },
  { name: "Borderlands 3", slug: "borderlands-3" },
  { name: "Brawl Stars", slug: "brawl-stars" },
  { name: "Call of Duty: Black Ops 6", slug: "bo6" },
  { name: "Call of Duty: Warzone", slug: "warzone" },
  { name: "Clash of Clans", slug: "clash-of-clans" },
  { name: "Clash Royale", slug: "clash-royale" },
  { name: "COD Mobile", slug: "cod-mobile" },
  { name: "Coin Master", slug: "coin-master" },
  { name: "CS2", slug: "cs2" },
  { name: "Cyberpunk 2077", slug: "cyberpunk-2077" },
  { name: "Dark Souls III", slug: "dark-souls-iii" },
  { name: "DayZ", slug: "dayz" },
  { name: "Destiny 2", slug: "destiny-2" },
  { name: "Diablo III", slug: "diablo-iii" },
  { name: "Diablo IV", slug: "diablo-iv" },
  { name: "Diablo IV (Console)", slug: "diablo-iv-console" },
  { name: "Diablo Immortal", slug: "diablo-immortal" },
  { name: "Dota 2", slug: "dota-2" },
  { name: "Dragon Ball: Sparking! Zero", slug: "sparking-zero" },
  { name: "Elder Scrolls Online", slug: "elder-scrolls-online" },
  { name: "Elden Ring", slug: "elden-ring" },
  { name: "Escape from Tarkov", slug: "escape-from-tarkov" },
  { name: "FC 25", slug: "fc-25" },
  { name: "FIFA 25", slug: "fifa-25" },
  { name: "Final Fantasy XIV", slug: "final-fantasy-xiv" },
  { name: "Fortnite", slug: "fortnite" },
  { name: "Free Fire", slug: "free-fire" },
  { name: "Game of Sultans", slug: "game-of-sultans" },
  { name: "Garena AOV", slug: "garena-aov" },
  { name: "Genshin Impact", slug: "genshin-impact" },
  { name: "God of War: Ragnarök", slug: "god-of-war-ragnarok" },
  { name: "GTA V", slug: "gta-v" },
  { name: "GTA VI", slug: "gta-vi" },
  { name: "Guild Wars 2", slug: "guild-wars-2" },
  { name: "Hearthstone", slug: "hearthstone" },
  { name: "Helldivers 2", slug: "helldivers-2" },
  { name: "Heroes of the Storm", slug: "heroes-of-the-storm" },
  { name: "Hogwarts Legacy", slug: "hogwarts-legacy" },
  { name: "Honkai: Star Rail", slug: "honkai-star-rail" },
  { name: "Honor of Kings", slug: "honor-of-kings" },
  { name: "Hunt: Showdown 1896", slug: "hunt-showdown" },
  { name: "League of Legends", slug: "league-of-legends" },
  { name: "Legends of Runeterra", slug: "legends-of-runeterra" },
  { name: "Lineage W", slug: "lineage-w" },
  { name: "Lords Mobile", slug: "lords-mobile" },
  { name: "Lost Ark", slug: "lost-ark" },
  { name: "Madden NFL 25", slug: "madden-25" },
  { name: "Magic: The Gathering Arena", slug: "mtg-arena" },
  { name: "MapleStory", slug: "maplestory" },
  { name: "Minecraft", slug: "minecraft" },
  { name: "Mobile Legends: Bang Bang", slug: "mobile-legends" },
  { name: "Monster Hunter Wilds", slug: "monster-hunter-wilds" },
  { name: "Monster Hunter: World", slug: "monster-hunter-world" },
  { name: "Mortal Kombat 1", slug: "mk1" },
  { name: "Mu Online", slug: "mu-online" },
  { name: "NBA 2K25", slug: "nba-2k25" },
  { name: "Neverwinter", slug: "neverwinter" },
  { name: "New World: Aeternum", slug: "new-world" },
  { name: "Old School RuneScape", slug: "old-school-runescape" },
  { name: "Other", slug: "other" },
  { name: "Overwatch 2", slug: "overwatch-2" },
  { name: "Path of Exile", slug: "path-of-exile" },
  { name: "Path of Exile 2", slug: "path-of-exile-2" },
  { name: "Perfect World", slug: "perfect-world" },
  { name: "PlayStation Network Account", slug: "psn-account" },
  { name: "Pokémon GO", slug: "pokemon-go" },
  { name: "Predecessor", slug: "predecessor" },
  { name: "PUBG Mobile", slug: "pubg-mobile" },
  { name: "PUBG: Battlegrounds", slug: "pubg" },
  { name: "Ragnarok Online", slug: "ragnarok-online" },
  { name: "Ragnarok X: Next Generation", slug: "ragnarok-x" },
  { name: "Red Dead Redemption 2", slug: "rdr2" },
  { name: "Rise of Kingdoms", slug: "rise-of-kingdoms" },
  { name: "Roblox", slug: "roblox" },
  { name: "RuneScape", slug: "runescape" },
  { name: "Rust", slug: "rust" },
  { name: "Smite 2", slug: "smite-2" },
  { name: "Spider-Man 2", slug: "spiderman-2" },
  { name: "Star Wars: The Old Republic", slug: "swtor" },
  { name: "State of Survival", slug: "state-of-survival" },
  { name: "Steam Account", slug: "steam-account" },
  { name: "Street Fighter 6", slug: "street-fighter-6" },
  { name: "Stumble Guys", slug: "stumble-guys" },
  { name: "Teamfight Tactics", slug: "teamfight-tactics" },
  { name: "Tekken 8", slug: "tekken-8" },
  { name: "The Division 2", slug: "the-division-2" },
  { name: "The Last of Us Part II", slug: "tlou2" },
  { name: "Throne and Liberty", slug: "throne-and-liberty" },
  { name: "Tom Clancy's Rainbow Six Siege", slug: "r6-siege" },
  { name: "VALORANT: The Game (Mobile)", slug: "valorant-mobile" },
  { name: "Valorant", slug: "valorant" },
  { name: "Warframe", slug: "warframe" },
  { name: "Whiteout Survival", slug: "whiteout-survival" },
  { name: "Wild Rift", slug: "wild-rift" },
  { name: "World of Warcraft", slug: "world-of-warcraft" },
  { name: "World of Warcraft Classic", slug: "wow-classic" },
  { name: "Wuthering Waves", slug: "wuthering-waves" },
  { name: "Xbox Game Pass Account", slug: "xbox-game-pass" },
  { name: "Zenless Zone Zero", slug: "zenless-zone-zero" },
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
    }
  } catch (err) {
    console.error(`  ❌ Failed: ${game.name}`, err.message);
  }
}

console.log(`\nDone: ${inserted} inserted, ${skipped} already existed — total ${GAMES.length} games`);
client.close();
