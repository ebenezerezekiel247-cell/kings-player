import { useLocation } from "wouter";
import { useGetGames, useGetListings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Gamepad2, ChevronRight, Search, TrendingUp } from "lucide-react";
import { useState } from "react";

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

  const { data: gamesData, isLoading } = useGetGames();
  const { data: listings } = useGetListings();

  // Build listing count per game from active listings
  const countByGame = new Map<string, number>();
  if (listings) {
    for (const l of listings) {
      countByGame.set(l.game, (countByGame.get(l.game) ?? 0) + 1);
    }
  }

  const games = (gamesData ?? []).map((g) => ({
    name: g.name,
    slug: g.slug,
    count: countByGame.get(g.name) ?? 0,
  }));

  // Sort: games with listings first (by count desc), then alphabetically
  const sorted = [...games].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  const filtered = search
    ? sorted.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  const withListings = filtered.filter((g) => g.count > 0);
  const withoutListings = filtered.filter((g) => g.count === 0);

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

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-14">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        )}

        {/* Games with active listings */}
        {!isLoading && withListings.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold font-serif">
                {search ? `Results for "${search}"` : "Active Games"}
              </h2>
              <span className="text-sm text-muted-foreground ml-1">({withListings.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {withListings.map((game, i) => (
                <button
                  key={game.name}
                  onClick={() => setLocation(`/browse?game=${encodeURIComponent(game.name)}`)}
                  className={`group relative flex flex-col items-start p-5 rounded-2xl bg-gradient-to-br border border-card-border hover:border-primary/50 transition-all overflow-hidden text-left ${GAME_COLORS[i % GAME_COLORS.length]}`}
                  data-testid={`button-game-${game.name.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🎮</div>
                  <div className="font-semibold text-sm text-foreground mb-1 leading-tight">{game.name}</div>
                  <div className="text-xs text-muted-foreground">{game.count} listing{game.count !== 1 ? "s" : ""}</div>
                  <ChevronRight className="absolute right-3 top-3 w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* All supported games */}
        {!isLoading && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold font-serif">
                {search ? "More Games" : "All Supported Games"}
              </h2>
            </div>
            {withoutListings.length === 0 && filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No games found matching your search.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(search ? filtered : withoutListings).map((game) => (
                  <button
                    key={game.name}
                    onClick={() => setLocation(`/browse?game=${encodeURIComponent(game.name)}`)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-card-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center group"
                    data-testid={`button-popular-${game.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="text-2xl group-hover:scale-110 transition-transform">🎮</div>
                    <span className="text-xs font-medium text-foreground leading-tight">{game.name}</span>
                  </button>
                ))}
              </div>
            )}
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
