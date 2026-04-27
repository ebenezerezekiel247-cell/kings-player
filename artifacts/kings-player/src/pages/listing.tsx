import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetListing,
  useGetListingComments,
  useCreateComment,
  useDeleteComment,
  useGetCategories,
  getGetListingQueryKey,
  getGetListingCommentsQueryKey,
} from "@workspace/api-client-react";
import { Show, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageSquare, Tag, Copy, ExternalLink, ArrowLeft, Trash2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ListingPage() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id, 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [comment, setComment] = useState("");

  const { data: listing, isLoading } = useGetListing(id, {
    query: { enabled: !!id, queryKey: getGetListingQueryKey(id) },
  });
  const { data: comments, isLoading: commentsLoading } = useGetListingComments(id, {
    query: { enabled: !!id, queryKey: getGetListingCommentsQueryKey(id) },
  });
  const { data: categories } = useGetCategories();

  const createComment = useCreateComment({
    mutation: {
      onSuccess: () => {
        setComment("");
        queryClient.invalidateQueries({ queryKey: getGetListingCommentsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(id) });
      },
    },
  });

  const deleteComment = useDeleteComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetListingCommentsQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetListingQueryKey(id) });
      },
    },
  });

  const copyDiscord = () => {
    if (listing?.discordUsername) {
      navigator.clipboard.writeText(listing.discordUsername);
      toast({ title: "Copied!", description: "Discord username copied to clipboard." });
    }
  };

  const openDiscord = () => {
    if (listing?.discordUsername) {
      window.open(`https://discord.com/users/${listing.discordUsername}`, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-8 w-24 bg-muted animate-pulse rounded mb-6" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="h-64 bg-muted animate-pulse rounded-xl" />
            <div className="h-6 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-48 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold mb-2">Listing not found</h2>
        <Button onClick={() => setLocation("/browse")}>Back to Marketplace</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={() => setLocation("/browse")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-6"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </button>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Image */}
          {listing.imageUrl ? (
            <div className="rounded-xl overflow-hidden bg-muted aspect-video">
              <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-xl bg-gradient-to-br from-card to-muted aspect-video flex items-center justify-center">
              <Tag className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}

          {/* Title & info */}
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <Badge variant="outline" className="text-xs">{listing.category}</Badge>
              <Badge variant="secondary" className="text-xs">{listing.game}</Badge>
              {listing.featured && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  <Crown className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary">Featured</span>
                </div>
              )}
              {listing.status !== "active" && (
                <Badge variant="destructive" className="text-xs capitalize">{listing.status}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2 font-serif" data-testid="text-listing-title">{listing.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{listing.viewCount} views</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" />{listing.commentCount} comments</span>
              <span>Listed {new Date(listing.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* Comments */}
          <div>
            <h2 className="text-lg font-semibold mb-4 font-serif flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Comments ({comments?.length ?? 0})
            </h2>

            <Show when="signed-in">
              <div className="mb-6 flex flex-col gap-3">
                <Textarea
                  placeholder="Leave a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-24 resize-none"
                  data-testid="input-comment"
                />
                <Button
                  className="self-end"
                  disabled={!comment.trim() || createComment.isPending}
                  onClick={() => {
                    if (comment.trim()) {
                      createComment.mutate({ id, data: { content: comment } });
                    }
                  }}
                  data-testid="button-submit-comment"
                >
                  {createComment.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </Show>

            <Show when="signed-out">
              <div className="mb-6 p-4 rounded-xl bg-card border border-card-border text-center">
                <p className="text-muted-foreground text-sm mb-3">Sign in to leave a comment</p>
                <Button size="sm" onClick={() => setLocation("/sign-in")} data-testid="button-sign-in-comment">Sign In</Button>
              </div>
            </Show>

            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3 p-4 rounded-xl bg-card border border-card-border" data-testid={`comment-${c.id}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {c.authorAvatarUrl ? (
                        <img src={c.authorAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary">{(c.authorUsername ?? "U")[0]}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium">{c.authorUsername ?? "Anonymous"}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                          {user && c.authorClerkId === user.id && (
                            <button
                              onClick={() => deleteComment.mutate({ id: c.id })}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              data-testid={`button-delete-comment-${c.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No comments yet. Be the first!</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price */}
          <div className="p-5 rounded-xl bg-card border border-card-border">
            <div className="text-3xl font-bold text-primary mb-1" data-testid="text-listing-price">
              ${listing.price.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Negotiable with seller</p>
          </div>

          {/* Contact Seller */}
          <div className="p-5 rounded-xl bg-card border border-card-border space-y-3">
            <h3 className="font-semibold text-sm">Contact Seller</h3>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/30">
              <svg className="w-5 h-5 text-[#5865F2] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/>
              </svg>
              <span className="text-sm font-medium text-[#7289da]" data-testid="text-discord-username">{listing.discordUsername}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={copyDiscord} data-testid="button-copy-discord">
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              <Button size="sm" className="flex-1" onClick={openDiscord} data-testid="button-contact-discord">
                <ExternalLink className="w-4 h-4 mr-1" />
                Discord
              </Button>
            </div>
          </div>

          {/* Seller */}
          {listing.sellerUsername && (
            <div
              className="p-5 rounded-xl bg-card border border-card-border cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setLocation(`/profile/${listing.sellerClerkId}`)}
              data-testid="button-seller-profile"
            >
              <h3 className="font-semibold text-sm mb-3">Seller</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {listing.sellerAvatarUrl ? (
                    <img src={listing.sellerAvatarUrl} alt="seller" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-primary">{listing.sellerUsername[0]}</span>
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm">{listing.sellerUsername}</div>
                  <div className="text-xs text-muted-foreground">View profile</div>
                </div>
              </div>
            </div>
          )}

          {/* Browse by Category */}
          {categories && categories.length > 0 && (
            <div className="p-5 rounded-xl bg-card border border-card-border">
              <h3 className="font-semibold text-sm mb-3">Browse by Category</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setLocation(`/browse?category=${cat.slug}`)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-colors border border-card-border"
                    data-testid={`pill-category-${cat.slug}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
