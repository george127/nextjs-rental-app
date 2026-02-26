import express from "express";
import { prisma } from "../lib/prisma.ts";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const applications = await prisma.propertyApplication.findMany({
      include: {
        property: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      applications,
    });

  } catch (error) {
    console.error("Fetch applications error:", error);

    return res.status(500).json({
      error: "Failed to fetch applications",
    });
  }
});

export default router;