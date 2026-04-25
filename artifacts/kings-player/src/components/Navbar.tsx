import { Link, useLocation } from "wouter";
import { Show, useUser } from "@clerk/react";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ShoppingBag, Crown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const { user } = useUser();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Crown className="w-6 h-6 text-primary" />
          <span className="font-serif text-xl font-bold tracking-wide text-primary">
            KINGS <span className="text-foreground">PLAYER</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Marketplace
          </Link>
          <Link href="/games" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Games
          </Link>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </Show>
        </nav>

        {/* Search bar (desktop) */}
        <div className="hidden md:block flex-1 max-w-sm">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search games, items..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
              data-testid="input-navbar-search"
            />
          </form>
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Show when="signed-out">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/sign-in")} data-testid="button-sign-in">
              Sign In
            </Button>
            <Button size="sm" onClick={() => setLocation("/sign-up")} data-testid="button-sign-up">
              Get Started
            </Button>
          </Show>
          <Show when="signed-in">
            <Button variant="outline" size="sm" onClick={() => setLocation("/create")} data-testid="button-create-listing">
              <ShoppingBag className="w-4 h-4 mr-1" />
              Sell
            </Button>
            <button
              onClick={() => user && setLocation(`/profile/${user.id}`)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
              data-testid="button-user-profile"
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="avatar" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs text-primary font-bold">{user?.firstName?.[0] ?? "U"}</span>
                </div>
              )}
              <span className="text-sm text-foreground">{user?.firstName ?? user?.username ?? "Profile"}</span>
            </button>
          </Show>
        </div>

        {/* Mobile: search + menu icons */}
        <div className="flex md:hidden items-center gap-2">
          <button
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}
            data-testid="button-mobile-search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search games, items..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            />
          </form>
        </div>
      )}

      {/* Mobile nav menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-3">
          <Link href="/browse" className="text-sm text-muted-foreground py-1" onClick={() => setMobileOpen(false)}>
            Marketplace
          </Link>
          <Link href="/games" className="text-sm text-muted-foreground py-1" onClick={() => setMobileOpen(false)}>
            Games
          </Link>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm text-muted-foreground py-1" onClick={() => setMobileOpen(false)}>
              Dashboard
            </Link>
            <Link href="/create" className="text-sm text-muted-foreground py-1" onClick={() => setMobileOpen(false)}>
              Sell Item
            </Link>
          </Show>
          <Show when="signed-out">
            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => { setLocation("/sign-in"); setMobileOpen(false); }}
              >
                Sign In
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => { setLocation("/sign-up"); setMobileOpen(false); }}
              >
                Get Started
              </Button>
            </div>
          </Show>
          <Show when="signed-in">
            <button
              onClick={() => { user && setLocation(`/profile/${user.id}`); setMobileOpen(false); }}
              className="flex items-center gap-2 py-1 text-sm text-muted-foreground"
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="avatar" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs text-primary font-bold">{user?.firstName?.[0] ?? "U"}</span>
                </div>
              )}
              {user?.firstName ?? user?.username ?? "My Profile"}
            </button>
          </Show>
        </div>
      )}
    </header>
  );
}
