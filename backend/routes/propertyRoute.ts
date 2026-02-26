import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../lib/jwt.ts";

const router = express.Router();
const prisma = new PrismaClient();

interface JwtPayload {
  userId?: string;
  email?: string;
  role: "TENANT" | "MANAGER";
}

// Helper to extract Bearer token
function getTokenFromHeader(req: any): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

/* ============================
   CREATE PROPERTY
============================ */
router.post("/", async (req: any, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token)
      return res.status(401).json({ error: "Unauthorized. No token." });

    const payload = verifyToken(token) as JwtPayload;

    if (payload.role !== "MANAGER")
      return res
        .status(403)
        .json({ error: "Only managers can create properties." });

    const {
      name,
      address,
      city,
      state,
      zipCode,
      rentAmount,
      securityDeposit,
      bedrooms,
      bathrooms,
      squareFeet,
      description,
      propertyType,
      amenities,
      imageData, // ✅ receive base64 from frontend
    } = req.body;

    if (
      !name ||
      !address ||
      !city ||
      !state ||
      !zipCode ||
      rentAmount === undefined ||
      bedrooms === undefined ||
      bathrooms === undefined ||
      !propertyType
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const amenitiesArray: string[] = Array.isArray(amenities)
      ? amenities
      : typeof amenities === "string"
      ? amenities.split(",").map((a: string) => a.trim())
      : [];

    const property = await prisma.property.create({
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        rentAmount: Number(rentAmount),
        securityDeposit: Number(securityDeposit) || 0,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        squareFeet: squareFeet ? Number(squareFeet) : null,
        description,
        propertyType,
        amenities: amenitiesArray,
        imageData: imageData || null, // ✅ store directly
        manager: {
          connect: payload.userId
            ? { id: payload.userId }
            : payload.email
            ? { email: payload.email }
            : { cognitoSub: (payload as any).sub },
        },
      },
    });

    return res.status(201).json(property);
  } catch (error) {
    console.error("CREATE PROPERTY ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================
   FETCH MANAGER PROPERTIES
============================ */
router.get("/", async (req: any, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token)
      return res.status(401).json({ error: "Unauthorized. No token." });

    const payload = verifyToken(token) as JwtPayload;

    if (payload.role !== "MANAGER")
      return res
        .status(403)
        .json({ error: "Only managers can view properties." });

    const properties = await prisma.property.findMany({
      where: payload.userId
        ? { managerId: payload.userId }
        : { manager: { email: payload.email } },
      orderBy: { createdAt: "desc" },
    });

    return res.json(properties);
  } catch (error) {
    console.error("FETCH PROPERTIES ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================
   UPDATE PROPERTY
============================ */
router.patch("/", async (req: any, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token)
      return res.status(401).json({ error: "Unauthorized. No token." });

    const payload = verifyToken(token) as JwtPayload;

    if (payload.role !== "MANAGER")
      return res
        .status(403)
        .json({ error: "Only managers can update properties." });

    const { id, ...updateData } = req.body;

    if (!id)
      return res.status(400).json({ error: "Property ID required" });

    const property = await prisma.property.findFirst({
      where: payload.userId
        ? { id, managerId: payload.userId }
        : { id, manager: { email: payload.email } },
    });

    if (!property)
      return res
        .status(404)
        .json({ error: "Property not found or unauthorized" });

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    return res.json(updatedProperty);
  } catch (error) {
    console.error("UPDATE PROPERTY ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* ============================
   DELETE PROPERTY
============================ */
router.delete("/", async (req: any, res) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token)
      return res.status(401).json({ error: "Unauthorized. No token." });

    const payload = verifyToken(token) as JwtPayload;

    if (payload.role !== "MANAGER")
      return res
        .status(403)
        .json({ error: "Only managers can delete properties." });

    const { id } = req.body;

    if (!id)
      return res.status(400).json({ error: "Property ID required" });

    const property = await prisma.property.findFirst({
      where: payload.userId
        ? { id, managerId: payload.userId }
        : { id, manager: { email: payload.email } },
    });

    if (!property)
      return res
        .status(404)
        .json({ error: "Property not found or unauthorized" });

    await prisma.property.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE PROPERTY ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;