/**
 * Self-contained Vercel serverless function for the Kings Player API.
 *
 * IMPORTANT: This file MUST NOT import from any @workspace/* packages.
 * Vercel cannot resolve pnpm workspace symlinks at bundle/deploy time.
 * All schema definitions, zod validators, and route logic are inlined here.
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import cors from "cors";
import { clerkMiddleware, getAuth, createClerkClient } from "@clerk/express";
import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql/http";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import {
  eq,
  desc,
  asc,
  and,
  gte,
  lte,
  like,
  or,
  sql as sqlExpr,
  count,
  countDistinct,
} from "drizzle-orm";
import * as z from "zod";

// ─── Database Schema ───────────────────────────────────────────────────────────

const listingsTable = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  game: text("game").notNull(),
  category: text("category"),
  imageUrl: text("image_url"),
  discordUsername: text("discord_username").notNull(),
  sellerClerkId: text("seller_clerk_id").notNull(),
  sellerUsername: text("seller_username"),
  sellerAvatarUrl: text("seller_avatar_url"),
  viewCount: integer("view_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  status: text("status", { enum: ["active", "sold", "inactive"] })
    .notNull()
    .default("active"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clerkId: text("clerk_id").notNull().unique(),
  username: text("username"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  discordUsername: text("discord_username"),
  listingCount: integer("listing_count").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const commentsTable = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),
  authorClerkId: text("author_clerk_id").notNull(),
  authorUsername: text("author_username"),
  authorAvatarUrl: text("author_avatar_url"),
  content: text("content").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

const categoriesTable = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  gameCount: integer("game_count").notNull().default(0),
});

const gamesTable = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  listingCount: integer("listing_count").notNull().default(0),
});

const schema = { listingsTable, usersTable, commentsTable, categoriesTable, gamesTable };

// ─── Database Client (lazy singleton) ─────────────────────────────────────────

type DbType = ReturnType<typeof drizzle<typeof schema>>;
let _db: DbType | null = null;

function getDb(): DbType {
  if (_db) return _db;
  const rawUrl = process.env.TURSO_URL;
  const token = process.env.TURSO_TOKEN;
  if (!rawUrl) throw new Error("TURSO_URL is not set");
  if (!token) throw new Error("TURSO_TOKEN is not set");
  const url = rawUrl.replace(/^libsql:\/\//, "https://");
  const client = createClient({ url, authToken: token });
  _db = drizzle(client, { schema });
  return _db;
}

// ─── Zod Validation Schemas ────────────────────────────────────────────────────

const GetListingsQueryParams = z.object({
  category: z.coerce.string().nullish(),
  game: z.coerce.string().nullish(),
  search: z.coerce.string().nullish(),
  minPrice: z.coerce.number().nullish(),
  maxPrice: z.coerce.number().nullish(),
  sort: z
    .union([
      z.literal("price_asc"),
      z.literal("price_desc"),
      z.literal("newest"),
      z.literal("popular"),
      z.literal(null),
    ])
    .nullish(),
});

const CreateListingBody = z.object({
  title: z.string(),
  description: z.string(),
  price: z.number(),
  game: z.string(),
  category: z.string().optional(),
  imageUrl: z.string().nullish(),
  discordUsername: z.string(),
});

const GetListingParams = z.object({ id: z.coerce.number() });
const UpdateListingParams = z.object({ id: z.coerce.number() });
const DeleteListingParams = z.object({ id: z.coerce.number() });

const UpdateListingBody = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  game: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().nullish(),
  discordUsername: z.string().optional(),
  status: z.enum(["active", "sold", "inactive"]).optional(),
});

const GetListingCommentsParams = z.object({ id: z.coerce.number() });
const CreateCommentParams = z.object({ id: z.coerce.number() });
const CreateCommentBody = z.object({ content: z.string() });
const DeleteCommentParams = z.object({ id: z.coerce.number() });
const GetUserProfileParams = z.object({ clerkId: z.coerce.string() });
const UpdateMeBody = z.object({
  username: z.string().optional(),
  bio: z.string().optional(),
  discordUsername: z.string().optional(),
});

// ─── Utilities ─────────────────────────────────────────────────────────────────

type AsyncFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { userId: string }).userId = auth.userId;
  next();
}

type ListingRow = typeof listingsTable.$inferSelect;
type UserRow = typeof usersTable.$inferSelect;
type CommentRow = typeof commentsTable.$inferSelect;

function mapListing(l: ListingRow) {
  return {
    id: l.id,
    title: l.title,
    description: l.description,
    price: Number(l.price),
    game: l.game,
    category: l.category ?? "",
    imageUrl: l.imageUrl,
    discordUsername: l.discordUsername,
    sellerClerkId: l.sellerClerkId,
    sellerUsername: l.sellerUsername,
    sellerAvatarUrl: l.sellerAvatarUrl,
    viewCount: l.viewCount,
    commentCount: l.commentCount,
    status: l.status,
    featured: l.featured,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

function mapUser(u: UserRow) {
  return {
    id: u.id,
    clerkId: u.clerkId,
    username: u.username,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    discordUsername: u.discordUsername,
    listingCount: u.listingCount,
    createdAt: u.createdAt,
  };
}

function mapComment(c: CommentRow) {
  return {
    id: c.id,
    listingId: c.listingId,
    authorClerkId: c.authorClerkId,
    authorUsername: c.authorUsername,
    authorAvatarUrl: c.authorAvatarUrl,
    content: c.content,
    createdAt: c.createdAt,
  };
}

// ─── Clerk Key Fallback ─────────────────────────────────────────────────────────
// Vite injects VITE_CLERK_PUBLISHABLE_KEY for the frontend build.
// @clerk/express needs plain CLERK_PUBLISHABLE_KEY (no VITE_ prefix).
// If it's missing, copy it so clerkMiddleware() doesn't throw on every request.
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.VITE_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
}

// ─── Express App ───────────────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk auth middleware — attaches auth info to req; does NOT block requests
app.use(clerkMiddleware());

// ─── Health ────────────────────────────────────────────────────────────────────

app.get("/api/healthz", (_req, res) => {
  res.json({
    status: "ok",
    env: {
      TURSO_URL: process.env.TURSO_URL ? "set" : "MISSING",
      TURSO_TOKEN: process.env.TURSO_TOKEN ? "set" : "MISSING",
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? "set" : "MISSING",
      CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY
        ? "set"
        : "MISSING",
      NODE_ENV: process.env.NODE_ENV ?? "undefined",
      NODE_VERSION: process.version,
    },
  });
});

// ─── Listings Routes ───────────────────────────────────────────────────────────

app.get(
  "/api/listings/featured",
  asyncHandler(async (_req, res) => {
    const db = getDb();
    const listings = await db
      .select()
      .from(listingsTable)
      .where(
        and(
          eq(listingsTable.featured, true),
          eq(listingsTable.status, "active"),
        ),
      )
      .orderBy(desc(listingsTable.createdAt))
      .limit(8);
    res.json(listings.map(mapListing));
  }),
);

app.get(
  "/api/listings",
  asyncHandler(async (req, res) => {
    const parsed = GetListingsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { category, game, search, minPrice, maxPrice, sort } = parsed.data;
    const db = getDb();
    const conditions: Parameters<typeof and>[0][] = [
      eq(listingsTable.status, "active"),
    ];

    if (category)
      conditions.push(eq(listingsTable.category, category));
    if (game) conditions.push(eq(listingsTable.game, game));
    if (search) {
      const term = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sqlExpr`lower(${listingsTable.title})`, term),
          like(sqlExpr`lower(${listingsTable.description})`, term),
          like(sqlExpr`lower(${listingsTable.game})`, term),
        )!,
      );
    }
    if (minPrice != null)
      conditions.push(gte(listingsTable.price, minPrice));
    if (maxPrice != null)
      conditions.push(lte(listingsTable.price, maxPrice));

    let orderBy;
    switch (sort) {
      case "price_asc":
        orderBy = asc(listingsTable.price);
        break;
      case "price_desc":
        orderBy = desc(listingsTable.price);
        break;
      case "popular":
        orderBy = desc(listingsTable.viewCount);
        break;
      default:
        orderBy = desc(listingsTable.createdAt);
    }

    const listings = await db
      .select()
      .from(listingsTable)
      .where(and(...conditions))
      .orderBy(orderBy);

    res.json(listings.map(mapListing));
  }),
);

app.post(
  "/api/listings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = CreateListingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const userId = (req as Request & { userId: string }).userId;
    const db = getDb();

    const userRows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);
    const seller = userRows[0];

    const [listing] = await db
      .insert(listingsTable)
      .values({
        ...parsed.data,
        price: Number(parsed.data.price),
        sellerClerkId: userId,
        sellerUsername: seller?.username ?? null,
        sellerAvatarUrl: seller?.avatarUrl ?? null,
      })
      .returning();

    if (seller) {
      await db
        .update(usersTable)
        .set({ listingCount: sqlExpr`${usersTable.listingCount} + 1` })
        .where(eq(usersTable.clerkId, userId));
    }

    res.status(201).json(mapListing(listing));
  }),
);

app.get(
  "/api/listings/:id",
  asyncHandler(async (req, res) => {
    const params = GetListingParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const db = getDb();
    const [listing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, params.data.id));

    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    await db
      .update(listingsTable)
      .set({ viewCount: sqlExpr`${listingsTable.viewCount} + 1` })
      .where(eq(listingsTable.id, params.data.id));

    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.listingId, params.data.id))
      .orderBy(asc(commentsTable.createdAt));

    res.json({ ...mapListing(listing), comments: comments.map(mapComment) });
  }),
);

app.patch(
  "/api/listings/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = UpdateListingParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateListingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const userId = (req as Request & { userId: string }).userId;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    if (existing.sellerClerkId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.price != null)
      updateData.price = Number(parsed.data.price);

    const [updated] = await db
      .update(listingsTable)
      .set(updateData)
      .where(eq(listingsTable.id, params.data.id))
      .returning();

    res.json(mapListing(updated));
  }),
);

app.delete(
  "/api/listings/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = DeleteListingParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const userId = (req as Request & { userId: string }).userId;
    const db = getDb();

    const [existing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }
    if (existing.sellerClerkId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db
      .delete(listingsTable)
      .where(eq(listingsTable.id, params.data.id));
    await db
      .update(usersTable)
      .set({
        listingCount: sqlExpr`MAX(${usersTable.listingCount} - 1, 0)`,
      })
      .where(eq(usersTable.clerkId, userId));

    res.sendStatus(204);
  }),
);

// ─── Comments Routes ───────────────────────────────────────────────────────────

app.get(
  "/api/listings/:id/comments",
  asyncHandler(async (req, res) => {
    const params = GetListingCommentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const db = getDb();
    const comments = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.listingId, params.data.id))
      .orderBy(asc(commentsTable.createdAt));
    res.json(comments.map(mapComment));
  }),
);

app.post(
  "/api/listings/:id/comments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = CreateCommentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateCommentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const userId = (req as Request & { userId: string }).userId;
    const db = getDb();

    const [listing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, params.data.id));
    if (!listing) {
      res.status(404).json({ error: "Listing not found" });
      return;
    }

    const userRows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId))
      .limit(1);
    const author = userRows[0];

    const [comment] = await db
      .insert(commentsTable)
      .values({
        listingId: params.data.id,
        authorClerkId: userId,
        authorUsername: author?.username ?? null,
        authorAvatarUrl: author?.avatarUrl ?? null,
        content: parsed.data.content,
      })
      .returning();

    await db
      .update(listingsTable)
      .set({ commentCount: sqlExpr`${listingsTable.commentCount} + 1` })
      .where(eq(listingsTable.id, params.data.id));

    res.status(201).json(mapComment(comment));
  }),
);

app.delete(
  "/api/comments/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = DeleteCommentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const userId = (req as Request & { userId: string }).userId;
    const db = getDb();

    const [comment] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, params.data.id));
    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
    if (comment.authorClerkId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db
      .delete(commentsTable)
      .where(eq(commentsTable.id, params.data.id));
    await db
      .update(listingsTable)
      .set({
        commentCount: sqlExpr`GREATEST(${listingsTable.commentCount} - 1, 0)`,
      })
      .where(eq(listingsTable.id, comment.listingId));

    res.sendStatus(204);
  }),
);

// ─── Users Routes ──────────────────────────────────────────────────────────────

async function ensureUser(clerkId: string, db: DbType): Promise<UserRow> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  if (existing) return existing;
  const [newUser] = await db
    .insert(usersTable)
    .values({ clerkId })
    .returning();
  return newUser;
}

async function syncClerkAvatar(clerkId: string): Promise<string | null> {
  try {
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const clerkUser = await clerk.users.getUser(clerkId);
    return clerkUser.imageUrl ?? null;
  } catch {
    return null;
  }
}

app.get(
  "/api/users/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as Request & { userId: string }).userId;
    const db = getDb();
    const user = await ensureUser(userId, db);

    if (!user.avatarUrl) {
      const avatarUrl = await syncClerkAvatar(userId);
      if (avatarUrl) {
        const [updated] = await db
          .update(usersTable)
          .set({ avatarUrl })
          .where(eq(usersTable.clerkId, userId))
          .returning();
        res.json(mapUser(updated));
        return;
      }
    }
    res.json(mapUser(user));
  }),
);

app.patch(
  "/api/users/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = UpdateMeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const userId = (req as Request & { userId: string }).userId;
    const db = getDb();
    await ensureUser(userId, db);

    const avatarUrl = await syncClerkAvatar(userId);
    const updateData = {
      ...parsed.data,
      ...(avatarUrl ? { avatarUrl } : {}),
    };

    const [updated] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.clerkId, userId))
      .returning();
    res.json(mapUser(updated));
  }),
);

app.get(
  "/api/users/me/listings",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = (req as Request & { userId: string }).userId;
    const db = getDb();
    const listings = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.sellerClerkId, userId))
      .orderBy(desc(listingsTable.createdAt));
    res.json(listings.map(mapListing));
  }),
);

app.get(
  "/api/users/:clerkId",
  asyncHandler(async (req, res) => {
    const params = GetUserProfileParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const db = getDb();
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, params.data.clerkId));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(mapUser(user));
  }),
);

// ─── Categories / Stats / Games ────────────────────────────────────────────────

app.get(
  "/api/categories",
  asyncHandler(async (_req, res) => {
    const db = getDb();
    const categories = await db.select().from(categoriesTable);
    res.json(categories);
  }),
);

app.get(
  "/api/games",
  asyncHandler(async (_req, res) => {
    const db = getDb();
    const games = await db.select().from(gamesTable).orderBy(gamesTable.name);
    res.json(games);
  }),
);

app.get(
  "/api/stats",
  asyncHandler(async (_req, res) => {
    const db = getDb();
    const [total] = await db.select({ count: count() }).from(listingsTable);
    const [active] = await db
      .select({ count: count() })
      .from(listingsTable)
      .where(eq(listingsTable.status, "active"));
    const [sellers] = await db
      .select({ count: countDistinct(listingsTable.sellerClerkId) })
      .from(listingsTable);
    const [games] = await db
      .select({ count: countDistinct(listingsTable.game) })
      .from(listingsTable);

    res.json({
      totalListings: Number(total.count),
      activeListings: Number(active.count),
      totalSellers: Number(sellers.count),
      totalGames: Number(games.count),
    });
  }),
);

// ─── Global Error Handler ──────────────────────────────────────────────────────

app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[api] unhandled error:", err);
    const message =
      err instanceof Error ? err.message : "Internal Server Error";
    res.status(500).json({ error: message });
  },
);

// ─── Vercel Function Export ────────────────────────────────────────────────────

export default app;
export const config = { api: { bodyParser: false } };
