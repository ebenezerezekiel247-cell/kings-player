import { useParams, useLocation } from "wouter";
import { useGetUserProfile, useGetListings, getGetUserProfileQueryKey, getGetListingsQueryKey } from "@workspace/api-client-react";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Crown, CalendarDays } from "lucide-react";

export default function ProfilePage() {
  const params = useParams<{ clerkId: string }>();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(params.clerkId, {
    query: {
      enabled: !!params.clerkId,
      queryKey: getGetUserProfileQueryKey(params.clerkId),
    },
  });

  const { data: listings } = useGetListings(
    { search: undefined, category: undefined, game: undefined },
    {
      query: { queryKey: getGetListingsQueryKey() },
    }
  );

  const sellerListings = listings?.filter((l) => l.sellerClerkId === params.clerkId);

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="h-40 bg-muted animate-pulse rounded-2xl mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
        <Button onClick={() => setLocation("/browse")} data-testid="button-back-browse">Browse Marketplace</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => history.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-6"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="p-6 rounded-2xl bg-card border border-card-border mb-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary">
                {(profile.username ?? "U")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-primary" />
              <h1 className="text-xl font-bold font-serif" data-testid="text-username">{profile.username ?? "Anonymous Seller"}</h1>
            </div>
            {profile.bio && <p className="text-muted-foreground text-sm mb-2">{profile.bio}</p>}
            {profile.discordUsername && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/>
                </svg>
                <span className="text-sm text-[#7289da]" data-testid="text-discord">{profile.discordUsername}</span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary" data-testid="text-listing-count">{profile.listingCount}</div>
            <div className="text-xs text-muted-foreground">Listings</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground justify-end">
              <CalendarDays className="w-3 h-3" />
              <span>Joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Listings */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold font-serif">Active Listings</h2>
        </div>
        {sellerListings && sellerListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sellerListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-xl bg-card border border-card-border">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No active listings</p>
          </div>
        )}
      </div>
    </div>
  );
}
