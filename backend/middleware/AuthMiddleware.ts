import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.ts"; 
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Expect token in Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ success: false, error: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // get token part

    if (!token) {
      return res.status(401).json({ success: false, error: "Invalid token format" });
    }

    // Verify JWT
    const payload = verifyToken(token); // throws if invalid

    // Attach user info to request for further usage
    (req as any).user = payload;

    next(); // allow route to continue
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}
