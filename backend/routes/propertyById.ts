import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET SINGLE PROPERTY BY ID
 * Public route
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log("PROPERTY ID:", id);

    if (!id) {
      return res.status(400).json({
        error: "Property ID missing",
      });
    }

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({
        error: "Property not found",
      });
    }

    return res.status(200).json(property);
  } catch (error) {
    console.error("PROPERTY FETCH ERROR:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;