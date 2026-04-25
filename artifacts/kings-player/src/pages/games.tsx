import { useLocation } from "wouter";
import { useGetListings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Gamepad2, ChevronRight, Search, TrendingUp } from "lucide-react";
import { useState } from "react";

const GAME_IMAGES: Record<string, string> = {
  "Valorant": "https://images.unsplash.com/photo-1614680376739-414d95ff43df?w=400&q=80",
  "League of Legends": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80",
  "World of Warcraft": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&q=80",
  "Diablo IV": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80",
  "Fortnite": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400&q=80",
  "CS2": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&q=80",
  "Apex Legends": "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&q=80",
  "Dota 2": "https://images.unsplash.com/photo-1506466010722-395aa2bef877?w=400&q=80",
};

const GAME_COLORS = [
  "from-red-900/40 to-red-800/20",
  "from-blue-900/40 to-blue-800/20",
  "from-purple-900/40 to-purple-800/20",
  "from-amber-900/40 to-amber-800/20",
  "from-green-900/40 to-green-800/20",
  "from-cyan-900/40 to-cyan-800/20",
  "from-pink-900/40 to-pink-800/20",
  "from-orange-900/40 to-orange-800/20",
  "from-indigo-900/40 to-indigo-800/20",
  "from-teal-900/40 to-teal-800/20",
];

export default function GamesPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  const { data: listings, isLoading } = useGetListings();

  // Build game stats from listings
  const gameMap = new Map<string, { count: number; categories: Set<string> }>();
  if (listings) {
    for (const l of listings) {
      if (!gameMap.has(l.game)) {
        gameMap.set(l.game, { count: 0, categories: new Set() });
      }
      const entry = gameMap.get(l.game)!;
      entry.count++;
      entry.categories.add(l.category);
    }
  }

  const games = [...gameMap.entries()]
    .map(([name, { count, categories }]) => ({ name, count, categories: [...categories] }))
    .sort((a, b) => b.count - a.count);

  const filtered = search
    ? games.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : games;

  // Popular games from current listings + popular titles not in listings
  const allPopularGames = [
    "Valorant", "League of Legends", "World of Warcraft", "Diablo IV",
    "Fortnite", "CS2", "Apex Legends", "Dota 2", "Path of Exile",
    "Final Fantasy XIV", "Destiny 2", "Call of Duty", "Overwatch 2",
    "Elder Scrolls Online", "New World", "Lost Ark", "Elden Ring", "GTA V",
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Gamepad2 className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold font-serif">Browse by Game</h1>
          </div>
          <p className="text-muted-foreground">Find listings for your favorite games</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search for a game..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            data-testid="input-game-search"
          />
        </div>

        {/* Games with active listings */}
        {!isLoading && games.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold font-serif">
                {search ? `Results for "${search}"` : "Active Games"}
              </h2>
              <span className="text-sm text-muted-foreground ml-1">({filtered.length})</span>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No games found matching your search.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map((game, i) => (
                  <button
                    key={game.name}
                    onClick={() => setLocation(`/browse?game=${encodeURIComponent(game.name)}`)}
                    className={`group relative flex flex-col items-start p-5 rounded-2xl bg-gradient-to-br border border-card-border hover:border-primary/50 transition-all overflow-hidden text-left ${GAME_COLORS[i % GAME_COLORS.length]}`}
                    data-testid={`button-game-${game.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎮</div>
                    <div className="font-semibold text-sm text-foreground mb-1 leading-tight">{game.name}</div>
                    <div className="text-xs text-muted-foreground">{game.count} listing{game.count !== 1 ? "s" : ""}</div>
                    {game.categories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {game.categories.slice(0, 2).map((cat) => (
                          <span key={cat} className="text-xs px-1.5 py-0.5 rounded bg-background/40 text-muted-foreground">
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                    <ChevronRight className="absolute right-3 top-3 w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-14">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        )}

        {/* Popular Games */}
        {!search && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold font-serif">Popular Games</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {allPopularGames.map((game) => (
                <button
                  key={game}
                  onClick={() => setLocation(`/browse?game=${encodeURIComponent(game)}`)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-card-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center group"
                  data-testid={`button-popular-${game.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="text-2xl group-hover:scale-110 transition-transform">🎮</div>
                  <span className="text-xs font-medium text-foreground leading-tight">{game}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-16 text-center p-10 rounded-2xl bg-primary/5 border border-primary/20">
          <Gamepad2 className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold font-serif mb-2">Don't see your game?</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Create a listing for any game. Our marketplace supports all titles.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/browse")} data-testid="button-browse-all">
              Browse All Listings
            </Button>
            <Button variant="outline" onClick={() => setLocation("/create")} data-testid="button-create">
              Create Listing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
