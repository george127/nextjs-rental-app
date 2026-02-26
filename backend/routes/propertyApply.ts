import express from "express";
import { prisma } from "../lib/prisma.ts";
import { verifyToken } from "../lib/jwt.ts";
import type { JwtPayload } from "jsonwebtoken";

const router = express.Router();

interface CustomJwtPayload extends JwtPayload {
  userId: string;
  role?: string;
}

router.post("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ 1. Must be logged in
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Please login before applying.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Authentication token missing.",
      });
    }

    // ✅ 2. Verify token
    let payload: CustomJwtPayload;

    try {
      payload = verifyToken(token) as CustomJwtPayload;
    } catch (err) {
      return res.status(401).json({
        error: "Session expired. Please login again.",
      });
    }

    // ✅ 3. Get user from DATABASE (not just token)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    // ✅ 4. Role check (ONLY TENANTS CAN APPLY)
    if (user.role !== "TENANT") {
      return res.status(403).json({
        error: "Only tenants can apply for properties.",
      });
    }

    



// ✅ 7. Create application
const { propertyId, tenantName, email, phone, message } = req.body;

 // ✅ 6. Prevent duplicate applications
const existingApplication = await prisma.propertyApplication.findFirst({
  where: {
    propertyId,
    userId: user.id,
  },
});

if (existingApplication) {
  return res.status(409).json({
    error: "You have already applied for this property.",
  });
}

const application = await prisma.propertyApplication.create({
  data: {
    propertyId,
    userId: user.id,
    tenantName,
    email,
    phone,
    message,
  },
  include: {
    property: true,
  },
});

    return res.status(201).json({ application });

  } catch (error) {
    console.error("Application error:", error);
    return res.status(500).json({
      error: "Failed to submit application",
    });
  }
});

export default router;