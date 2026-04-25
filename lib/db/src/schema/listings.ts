import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  game: text("game").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  discordUsername: text("discord_username").notNull(),
  sellerClerkId: text("seller_clerk_id").notNull(),
  sellerUsername: text("seller_username"),
  sellerAvatarUrl: text("seller_avatar_url"),
  viewCount: integer("view_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  status: text("status", { enum: ["active", "sold", "inactive"] }).notNull().default("active"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, viewCount: true, commentCount: true, createdAt: true, updatedAt: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
