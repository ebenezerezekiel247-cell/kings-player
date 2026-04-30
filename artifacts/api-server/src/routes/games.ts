import { Router, type IRouter } from "express";
import { db, gamesTable } from "@workspace/db";
import { asyncHandler } from "../utils/asyncHandler";

const router: IRouter = Router();

router.get("/games", asyncHandler(async (_req, res) => {
  const games = await db.select().from(gamesTable).orderBy(gamesTable.name);
  res.json(games);
}));

export default router;
