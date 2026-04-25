import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, listingsTable } from "@workspace/db";
import { GetUserProfileParams, UpdateMeBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { desc } from "drizzle-orm";
import { clerkClient } from "@clerk/express";

const router: IRouter = Router();

async function ensureUser(clerkId: string): Promise<typeof usersTable.$inferSelect> {
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
    const clerkUser = await clerkClient.users.getUser(clerkId);
    return clerkUser.imageUrl ?? null;
  } catch {
    return null;
  }
}

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const user = await ensureUser(userId);

  // Sync avatar URL from Clerk in the background if missing
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
});

router.patch("/users/me", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = (req as any).userId as string;
  await ensureUser(userId);

  // Also sync avatar from Clerk on profile update
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
});

router.get("/users/me/listings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const listings = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.sellerClerkId, userId))
    .orderBy(desc(listingsTable.createdAt));

  res.json(listings.map(mapListing));
});

router.get("/users/:clerkId", async (req, res): Promise<void> => {
  const params = GetUserProfileParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, params.data.clerkId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(mapUser(user));
});

function mapUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    clerkId: u.clerkId,
    username: u.username,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    discordUsername: u.discordUsername,
    listingCount: u.listingCount,
    createdAt: u.createdAt.toISOString(),
  };
}

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
