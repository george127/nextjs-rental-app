import express from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const router = express.Router();
const prisma = new PrismaClient();

const CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID!;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET!;
const JWT_SECRET = process.env.JWT_SECRET!;

function getSecretHash(username: string) {
  return crypto
    .createHmac("SHA256", CLIENT_SECRET)
    .update(username + CLIENT_ID)
    .digest("base64");
}

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
});

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ✅ 1. Authenticate with Cognito
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: cleanEmail,
        PASSWORD: password,
        SECRET_HASH: getSecretHash(cleanEmail),
      },
    });

    await cognito.send(command);

    // ✅ 2. Get user from your DB
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found in database",
      });
    }

    // ✅ 3. Create YOUR JWT (THIS IS IMPORTANT)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role, // 👈 ROLE INSIDE TOKEN
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ 4. Return YOUR JWT
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error: any) {
    console.error("Login error:", error);

    if (error.name === "NotAuthorizedException") {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    if (error.name === "UserNotConfirmedException") {
      return res.status(400).json({
        success: false,
        error: "Please confirm your email first",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
});

export default router;
