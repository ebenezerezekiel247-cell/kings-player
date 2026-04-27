import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * Wraps an async Express route handler so rejected promises are forwarded
 * to Express's next(err) instead of becoming unhandled rejections that
 * crash the process. Required for Express 4 (Express 5 handles this natively).
 */
export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
