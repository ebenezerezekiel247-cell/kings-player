import { pgTable, text, serial, timestamp, numeric, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingStatusEnum = pgEnum("listing_status", ["active", "sold", "inactive"]);

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  game: text("game").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  discordUsername: text("discord_username").notNull(),
  sellerClerkId: text("seller_clerk_id").notNull(),
  sellerUsername: text("seller_username"),
  sellerAvatarUrl: text("seller_avatar_url"),
  viewCount: integer("view_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  status: listingStatusEnum("status").notNull().default("active"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, viewCount: true, commentCount: true, createdAt: true, updatedAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
