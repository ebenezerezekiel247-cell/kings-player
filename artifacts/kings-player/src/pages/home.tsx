import { useLocation } from "wouter";
import { useGetStats, useGetFeaturedListings, useGetCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ListingCard";
import { Crown, Shield, Zap, Users, Package, TrendingUp, ChevronRight } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { data: stats } = useGetStats();
  const { data: featured } = useGetFeaturedListings();
  const { data: categories } = useGetCategories();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">The Premier Gaming Marketplace</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 font-serif">
            Trade Like A <span className="text-primary">King</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Buy and sell gaming accounts, items, currency, and services. Connect with verified sellers via Discord. The marketplace built for serious players.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="text-base px-8" onClick={() => setLocation("/browse")} data-testid="button-browse-marketplace">
              Browse Marketplace
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" onClick={() => setLocation("/sign-up")} data-testid="button-start-selling">
              Start Selling
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="py-12 px-4 border-y border-border bg-card/30">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total Listings", value: stats.totalListings, icon: Package },
              { label: "Active Listings", value: stats.activeListings, icon: TrendingUp },
              { label: "Active Sellers", value: stats.totalSellers, icon: Users },
              { label: "Games Covered", value: stats.totalGames, icon: Zap },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="flex justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 font-serif">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setLocation(`/browse?category=${cat.slug}`)}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-card-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                  data-testid={`button-category-${cat.slug}`}
                >
                  <Package className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat.gameCount} games</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      {featured && featured.length > 0 && (
        <section className="py-16 px-4 bg-card/20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold font-serif">Featured Listings</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/browse")} data-testid="button-view-all">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Kings Player */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 font-serif">Why Kings Player</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Verified Sellers",
                description: "All sellers are verified through our platform. Seller ratings and history are transparent.",
              },
              {
                icon: Zap,
                title: "Discord Connect",
                description: "Contact sellers directly on Discord for fast, secure deal negotiation and delivery.",
              },
              {
                icon: Crown,
                title: "Premium Experience",
                description: "A curated marketplace for high-value gaming assets. Quality listings, serious buyers.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-card-border">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-12">
          <Crown className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4 font-serif">Ready to Start Trading?</h2>
          <p className="text-muted-foreground mb-8">Create your free account and start buying or selling in minutes.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation("/sign-up")} data-testid="button-cta-sign-up">Create Account</Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/browse")} data-testid="button-cta-browse">Browse Listings</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
