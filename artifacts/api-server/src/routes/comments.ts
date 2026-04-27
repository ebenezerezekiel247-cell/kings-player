import { Router, type IRouter } from "express";
import { eq, asc, sql } from "drizzle-orm";
import { db, commentsTable, listingsTable, usersTable } from "@workspace/db";
import {
  GetListingCommentsParams,
  CreateCommentParams,
  CreateCommentBody,
  DeleteCommentParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";

const router: IRouter = Router();

router.get("/listings/:id/comments", asyncHandler(async (req, res) => {
  const params = GetListingCommentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.listingId, params.data.id))
    .orderBy(asc(commentsTable.createdAt));

  res.json(comments.map(mapComment));
}));

router.post("/listings/:id/comments", requireAuth, asyncHandler(async (req, res) => {
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

  const userId = (req as any).userId as string;

  const [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, params.data.id));

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  const author = user[0];

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
    .set({ commentCount: sql`${listingsTable.commentCount} + 1` })
    .where(eq(listingsTable.id, params.data.id));

  res.status(201).json(mapComment(comment));
}));

router.delete("/comments/:id", requireAuth, asyncHandler(async (req, res) => {
  const params = DeleteCommentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = (req as any).userId as string;

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

  await db.delete(commentsTable).where(eq(commentsTable.id, params.data.id));

  await db
    .update(listingsTable)
    .set({ commentCount: sql`GREATEST(${listingsTable.commentCount} - 1, 0)` })
    .where(eq(listingsTable.id, comment.listingId));

  res.sendStatus(204);
}));

function mapComment(c: typeof commentsTable.$inferSelect) {
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

export default router;
