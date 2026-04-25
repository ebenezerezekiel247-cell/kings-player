import { useState } from "react";
import { useLocation } from "wouter";
import {
  useGetMyListings,
  useDeleteListing,
  useUpdateListing,
  getGetMyListingsQueryKey,
  getGetListingsQueryKey,
} from "@workspace/api-client-react";
import { Show, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, MessageSquare, Plus, Pencil, Trash2, Lock, Crown, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useGetMyListings({
    query: { queryKey: getGetMyListingsQueryKey() },
  });

  const deleteListing = useDeleteListing({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        toast({ title: "Listing deleted" });
      },
    },
  });

  const updateListing = useUpdateListing({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyListingsQueryKey() });
        toast({ title: "Status updated" });
      },
    },
  });

  return (
    <Show
      when="signed-in"
      fallback={
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <Lock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
          <Button onClick={() => setLocation("/sign-in")} data-testid="button-sign-in-dashboard">Sign In</Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold font-serif">My Dashboard</h1>
            </div>
            <p className="text-muted-foreground text-sm">Manage your listings and track performance</p>
          </div>
          <Button onClick={() => setLocation("/create")} data-testid="button-new-listing">
            <Plus className="w-4 h-4 mr-1" />
            New Listing
          </Button>
        </div>

        {/* Stats */}
        {listings && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Listings", value: listings.length },
              { label: "Active", value: listings.filter((l) => l.status === "active").length },
              { label: "Sold", value: listings.filter((l) => l.status === "sold").length },
              { label: "Total Views", value: listings.reduce((sum, l) => sum + l.viewCount, 0) },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl bg-card border border-card-border text-center" data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}>
                <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Listings */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="space-y-3">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
                data-testid={`row-listing-${listing.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={listing.status === "active" ? "default" : listing.status === "sold" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {listing.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{listing.category} · {listing.game}</span>
                  </div>
                  <h3 className="font-medium text-sm line-clamp-1 mb-1">{listing.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="text-primary font-bold">${listing.price.toFixed(2)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{listing.viewCount}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{listing.commentCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={listing.status}
                    onValueChange={(val) =>
                      updateListing.mutate({
                        id: listing.id,
                        data: { status: val as "active" | "sold" | "inactive" },
                      })
                    }
                  >
                    <SelectTrigger className="w-28 h-8 text-xs" data-testid={`select-status-${listing.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setLocation(`/listing/${listing.id}`)}
                    data-testid={`button-view-listing-${listing.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this listing?")) {
                        deleteListing.mutate({ id: listing.id });
                      }
                    }}
                    data-testid={`button-delete-listing-${listing.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl bg-card border border-card-border">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Create your first listing to start selling</p>
            <Button onClick={() => setLocation("/create")} data-testid="button-create-first">Create Listing</Button>
          </div>
        )}
      </div>
    </Show>
  );
}
