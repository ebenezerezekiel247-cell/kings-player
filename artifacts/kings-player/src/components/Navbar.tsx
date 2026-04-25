import { Link, useLocation } from "wouter";
import { Show, useUser } from "@clerk/react";
import { useState } from "react";
import { Menu, X, ShoppingBag, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Crown className="w-6 h-6 text-primary" />
          <span className="font-serif text-2xl tracking-wide text-primary">KINGS <span className="text-foreground">PLAYER</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Marketplace</Link>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/create" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sell</Link>
          </Show>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Show when="signed-out">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/sign-in")} data-testid="button-sign-in">Sign In</Button>
            <Button size="sm" onClick={() => setLocation("/sign-up")} data-testid="button-sign-up">Get Started</Button>
          </Show>
          <Show when="signed-in">
            <Button variant="outline" size="sm" onClick={() => setLocation("/create")} data-testid="button-create-listing">
              <ShoppingBag className="w-4 h-4 mr-1" />
              Sell Item
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
              <span className="text-sm text-foreground">{user?.firstName ?? "Profile"}</span>
            </button>
          </Show>
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-testid="button-mobile-menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-3">
          <Link href="/browse" className="text-sm text-muted-foreground py-1">Marketplace</Link>
          <Show when="signed-in">
            <Link href="/dashboard" className="text-sm text-muted-foreground py-1">Dashboard</Link>
            <Link href="/create" className="text-sm text-muted-foreground py-1">Sell</Link>
          </Show>
          <Show when="signed-out">
            <Button variant="ghost" size="sm" onClick={() => { setLocation("/sign-in"); setMobileOpen(false); }}>Sign In</Button>
            <Button size="sm" onClick={() => { setLocation("/sign-up"); setMobileOpen(false); }}>Get Started</Button>
          </Show>
        </div>
      )}
    </header>
  );
}
