import type { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const auth = req.header("authorization");
  if (!auth || !auth.startsWith("Basic ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  next();
}
