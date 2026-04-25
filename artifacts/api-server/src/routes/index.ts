import { Router, type IRouter } from "express";
import healthRouter from "./health";
import listingsRouter from "./listings";
import commentsRouter from "./comments";
import usersRouter from "./users";
import categoriesRouter from "./categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use(listingsRouter);
router.use(commentsRouter);
router.use(usersRouter);
router.use(categoriesRouter);

export default router;
