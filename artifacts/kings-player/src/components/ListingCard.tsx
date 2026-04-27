import { Link } from "wouter";
import { Eye, MessageSquare, Tag, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  game: string;
  imageUrl?: string | null;
  sellerUsername?: string | null;
  sellerAvatarUrl?: string | null;
  viewCount: number;
  commentCount: number;
  status: string;
  featured: boolean;
}

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link href={`/listing/${listing.id}`} data-testid={`card-listing-${listing.id}`}>
      <div className="group relative bg-card border border-card-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 cursor-pointer h-full flex flex-col">
        {listing.featured && (
          <div className="absolute top-3 right-3 z-10">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40">
              <Crown className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-semibold">Featured</span>
            </div>
          </div>
        )}
        {listing.imageUrl ? (
          <div className="aspect-video bg-muted overflow-hidden">
            <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-muted to-card flex items-center justify-center">
            <Tag className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}

        <div className="p-4 flex flex-col flex-1 gap-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs text-muted-foreground truncate">{listing.game}</span>
          </div>

          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-listing-title-${listing.id}`}>
            {listing.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{listing.description}</p>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-lg font-bold text-primary" data-testid={`text-price-${listing.id}`}>${listing.price.toFixed(2)}</span>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1 text-xs">
                <Eye className="w-3 h-3" />
                {listing.viewCount}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <MessageSquare className="w-3 h-3" />
                {listing.commentCount}
              </span>
            </div>
          </div>

          {listing.sellerUsername && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {listing.sellerAvatarUrl ? (
                  <img src={listing.sellerAvatarUrl} alt="seller" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-primary font-bold">{listing.sellerUsername[0]}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{listing.sellerUsername}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
