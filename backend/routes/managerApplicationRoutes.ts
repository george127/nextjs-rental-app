import express from "express";
import { prisma } from "../lib/prisma.ts";
import { requireManager } from "../middleware/requireManager.ts";
import { Prisma } from "@prisma/client";

const router = express.Router();

type ApplicationWithRelations = Prisma.PropertyApplicationGetPayload<{
  include: {
    property: true;
    user: { select: { email: true } };
  };
}>;

router.patch("/:id", requireManager, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const normalizedStatus = status?.toLowerCase();

    if (!["approved", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const application: ApplicationWithRelations | null =
      await prisma.propertyApplication.findUnique({
        where: { id },
        include: {
          property: true,
          user: { select: { email: true } },
        },
      });

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.status !== "pending") {
      return res
        .status(400)
        .json({ error: `Application already ${application.status}` });
    }

    const updatedApplication =
      await prisma.propertyApplication.update({
        where: { id },
        data: { status: normalizedStatus },
      });

    if (normalizedStatus === "approved" && application.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: application.user.email },
      });

      if (user) {
        const existingTenant =
          await prisma.tenantProfile.findUnique({
            where: { userId: user.id },
          });

        if (!existingTenant) {
          await prisma.tenantProfile.create({
            data: {
              userId: user.id,
              propertyId: application.propertyId,
              rentAmount: application.property.rentAmount,
              rentDueDay: 1,
            },
          });
        }
      }
    }

    return res.status(200).json({ application: updatedApplication });

  } catch (error) {
    console.error("Update application error:", error);
    return res.status(500).json({
      error: "Failed to update application",
    });
  }
});

export default router;