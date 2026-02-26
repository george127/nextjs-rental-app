import express from "express";
import { prisma } from "../lib/prisma.ts"; 

const router = express.Router();

/**
 * PUBLIC PROPERTY LISTING
 * Visible on landing page & tenant dashboard
 * NO AUTH REQUIRED
 */
router.get("/", async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: {
        status: "vacant",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        rentAmount: true,
        bedrooms: true,
        bathrooms: true,
        squareFeet: true,
        description: true,
        propertyType: true,
        amenities: true,
        imageData: true,
        status: true,
      },
    });

    return res.status(200).json(properties);
  } catch (error) {
    console.error("PUBLIC PROPERTY FETCH ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch properties",
    });
  }
});

export default router;