import express from "express";
import { prisma } from "../lib/prisma.ts";
import { verifyToken } from "../lib/jwt.ts";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // ✅ Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    let decoded: any;

    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // ✅ Extract userId safely (works for id, userId, or sub)
    const userId = decoded.id || decoded.userId || decoded.sub;
    const role = decoded.role?.toUpperCase();

    if (!userId || role !== "TENANT") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ✅ Find tenant profile + property
    const tenantProfile = await prisma.tenantProfile.findFirst({
      where: { userId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            rentAmount: true,
            securityDeposit: true,
            bedrooms: true,
            bathrooms: true,
            squareFeet: true,
            description: true,
            propertyType: true,
            amenities: true,
            status: true,
            imageData: true,
          },
        },
      },
    });

    if (!tenantProfile) {
      return res.status(403).json({
        error: "Tenant not approved yet",
      });
    }

    return res.status(200).json({
      property: tenantProfile.property,
    });

  } catch (error) {
    console.error("Tenant property error:", error);
    return res.status(500).json({
      error: "Failed to load property",
    });
  }
});

export default router;