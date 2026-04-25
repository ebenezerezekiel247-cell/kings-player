import { Router, type IRouter } from "express";
import { eq, desc, asc, and, gte, lte, ilike, or, sql } from "drizzle-orm";
import { db, listingsTable, usersTable } from "@workspace/db";
import {
  GetListingsQueryParams,
  GetListingParams,
  UpdateListingParams,
  UpdateListingBody,
  CreateListingBody,
  DeleteListingParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.get("/listings/featured", async (_req, res): Promise<void> => {
  const listings = await db
    .select()
    .from(listingsTable)
    .where(and(eq(listingsTable.featured, true), eq(listingsTable.status, "active")))
    .orderBy(desc(listingsTable.createdAt))
    .limit(8);

  const mapped = listings.map(mapListing);
  res.json(mapped);
});

router.get("/listings", async (req, res): Promise<void> => {
  const parsed = GetListingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, game, search, minPrice, maxPrice, sort } = parsed.data;

  const conditions = [eq(listingsTable.status, "active")];

  if (category) {
    conditions.push(eq(listingsTable.category, category));
  }
  if (game) {
    conditions.push(eq(listingsTable.game, game));
  }
  if (search) {
    conditions.push(
      or(
        ilike(listingsTable.title, `%${search}%`),
        ilike(listingsTable.description, `%${search}%`),
        ilike(listingsTable.game, `%${search}%`)
      )!
    );
  }
  if (minPrice != null) {
    conditions.push(gte(listingsTable.price, String(minPrice)));
  }
  if (maxPrice != null) {
    conditions.push(lte(listingsTable.price, String(maxPrice)));
  }

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
    case "newest":
    default:
      orderBy = desc(listingsTable.createdAt);
  }

  const listings = await db
    .select()
    .from(listingsTable)
    .where(and(...conditions))
    .orderBy(orderBy);

  res.json(listings.map(mapListing));
});

router.post("/listings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = (req as any).userId as string;

  const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  const seller = user[0];

  const [listing] = await db
    .insert(listingsTable)
    .values({
      ...parsed.data,
      price: String(parsed.data.price),
      sellerClerkId: userId,
      sellerUsername: seller?.username ?? null,
      sellerAvatarUrl: seller?.avatarUrl ?? null,
    })
    .returning();

  if (seller) {
    await db
      .update(usersTable)
      .set({ listingCount: sql`${usersTable.listingCount} + 1` })
      .where(eq(usersTable.clerkId, userId));
  }

  res.status(201).json(mapListing(listing));
});

router.get("/listings/:id", async (req, res): Promise<void> => {
  const params = GetListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

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
    .set({ viewCount: sql`${listingsTable.viewCount} + 1` })
    .where(eq(listingsTable.id, params.data.id));

  res.json({ ...mapListing(listing), comments: [] });
});

router.patch("/listings/:id", requireAuth, async (req, res): Promise<void> => {
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

  const userId = (req as any).userId as string;

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
  if (parsed.data.price != null) {
    updateData.price = String(parsed.data.price);
  }

  const [updated] = await db
    .update(listingsTable)
    .set(updateData)
    .where(eq(listingsTable.id, params.data.id))
    .returning();

  res.json(mapListing(updated));
});

router.delete("/listings/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteListingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req as any).userId as string;

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

  await db.delete(listingsTable).where(eq(listingsTable.id, params.data.id));

  await db
    .update(usersTable)
    .set({ listingCount: sql`GREATEST(${usersTable.listingCount} - 1, 0)` })
    .where(eq(usersTable.clerkId, userId));

  res.sendStatus(204);
});

function mapListing(l: typeof listingsTable.$inferSelect) {
  return {
    id: l.id,
    title: l.title,
    description: l.description,
    price: Number(l.price),
    game: l.game,
    category: l.category,
    imageUrl: l.imageUrl,
    discordUsername: l.discordUsername,
    sellerClerkId: l.sellerClerkId,
    sellerUsername: l.sellerUsername,
    sellerAvatarUrl: l.sellerAvatarUrl,
    viewCount: l.viewCount,
    commentCount: l.commentCount,
    status: l.status,
    featured: l.featured,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

export default router;
