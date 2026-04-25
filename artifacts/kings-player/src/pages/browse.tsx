import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetListings, useGetCategories, getGetListingsQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function BrowsePage() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [game, setGame] = useState(params.get("game") ?? "");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = {
    search: search || undefined,
    category: category || undefined,
    game: game || undefined,
    sort: (sort as "newest" | "price_asc" | "price_desc" | "popular") || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
  };

  const { data: listings, isLoading } = useGetListings(queryParams, {
    query: { queryKey: getGetListingsQueryKey(queryParams) },
  });
  const { data: categories } = useGetCategories();

  const games = listings ? [...new Set(listings.map((l) => l.game))].sort() : [];

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setGame("");
    setSort("newest");
    setMinPrice("");
    setMaxPrice("");
  };

  const hasFilters = search || category || game || minPrice || maxPrice || sort !== "newest";

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif mb-2">Marketplace</h1>
          <p className="text-muted-foreground">Find gaming accounts, items, currency, and more</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search listings, games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full md:w-44" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-filters"
            className={showFilters ? "border-primary text-primary" : ""}
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {hasFilters && <span className="ml-1 w-2 h-2 rounded-full bg-primary" />}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mb-6 p-4 rounded-xl bg-card border border-card-border flex flex-wrap gap-4">
            <div className="flex-1 min-w-40">
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="text-xs text-muted-foreground mb-1 block">Game</label>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger data-testid="select-game">
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Games</SelectItem>
                  {games.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-32">
              <label className="text-xs text-muted-foreground mb-1 block">Min Price ($)</label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                data-testid="input-min-price"
              />
            </div>
            <div className="flex-1 min-w-32">
              <label className="text-xs text-muted-foreground mb-1 block">Max Price ($)</label>
              <Input
                type="number"
                placeholder="999"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                data-testid="input-max-price"
              />
            </div>
            {hasFilters && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : listings && listings.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">{listings.length} listing{listings.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No listings found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters or search terms</p>
            {hasFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>Clear Filters</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
