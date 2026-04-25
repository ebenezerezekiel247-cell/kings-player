import { Router, type IRouter } from "express";
import { db, categoriesTable, listingsTable } from "@workspace/db";
import { eq, count, countDistinct } from "drizzle-orm";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable);
  res.json(categories);
});

router.get("/stats", async (_req, res): Promise<void> => {
  const [total] = await db
    .select({ count: count() })
    .from(listingsTable);

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
});

export default router;
