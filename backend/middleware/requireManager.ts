import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.ts";
import { prisma } from "../lib/prisma.ts";

export async function requireManager(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    let payload: any;

    try {
      payload = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        error: "Invalid or expired token.",
      });
    }

    // Get user from DB (do NOT trust token role blindly)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId || payload.id },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    if (user.role !== "MANAGER") {
      return res.status(403).json({
        error: "Access denied. Managers only.",
      });
    }

    // Attach user to request (optional but useful)
    (req as any).user = user;

    next();

  } catch (error) {
    console.error("Manager middleware error:", error);
    return res.status(500).json({
      error: "Authorization failed.",
    });
  }
}