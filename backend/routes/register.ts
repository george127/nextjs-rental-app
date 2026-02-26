// backend/routes/register.ts
import express from "express"; // default import for CommonJS module
import type { Request, Response } from "express"; // types only
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
 
const router = express.Router();
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// --------------------- COGNITO SETUP ---------------------
const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const CLIENT_ID = process.env.COGNITO_USER_POOL_CLIENT_ID!;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET!;

// ------------------- HELPERS ----------------------------
function getSecretHash(username: string) {
  return crypto
    .createHmac("SHA256", CLIENT_SECRET)
    .update(username + CLIENT_ID)
    .digest("base64");
}

function formatPhoneE164(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "233" + digits.slice(1); // Ghana example
  const formatted = `+${digits}`;
  const regex = /^\+[1-9]\d{7,14}$/;
  return regex.test(formatted) ? formatted : null;
}

function validateRole(role: string) {
  const allowedRoles = ["TENANT", "MANAGER"];
  return allowedRoles.includes(role);
}

// ------------------- ROUTES -----------------------------

// POST /api/register
router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, password, role, name, phone } = req.body;

    if (!email || !password || !role)
      return res.status(400).json({ success: false, error: "Missing required fields" });

    if (!validateRole(role))
      return res.status(400).json({ success: false, error: "Invalid role selected" });

    const formattedPhone = formatPhoneE164(phone);
    if (phone && !formattedPhone)
      return res.status(400).json({ success: false, error: "Invalid phone number" });

    // Cognito signup
    await cognito.send(
      new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        SecretHash: getSecretHash(email),
        UserAttributes: [
          { Name: "email", Value: email },
          ...(name ? [{ Name: "name", Value: name }] : []),
          ...(formattedPhone ? [{ Name: "phone_number", Value: formattedPhone }] : []),
        ],
      })
    );

    // Save to database if not exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
      await prisma.user.create({
        data: { email, cognitoSub: email, name, phone: formattedPhone, role },
      });
    }

    res.json({ success: true, message: "Registration successful. Check your email for verification code." });
  } catch (error: any) {
    console.error("SignUp Error:", error);
    if (error.name === "UsernameExistsException")
      return res.status(400).json({ success: false, error: "User already exists" });
    res.status(500).json({ success: false, error: error.message || "Registration failed" });
  }
});

// PUT /api/register/confirm
router.put("/confirm", async (req: Request, res: Response) => {
  try {
    const { email, confirmationCode, role } = req.body;

    if (!email || !confirmationCode || !role)
      return res.status(400).json({ success: false, error: "Email, code and role required" });

    if (!validateRole(role))
      return res.status(400).json({ success: false, error: "Invalid role selected" });

    await cognito.send(
      new ConfirmSignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
        SecretHash: getSecretHash(email),
      })
    );

    await prisma.user.update({ where: { email }, data: { role } });

    res.json({ success: true, message: "Email verified successfully" });
  } catch (error: any) {
    console.error("Confirm Error:", error);
    if (error.name === "CodeMismatchException")
      return res.status(400).json({ success: false, error: "Invalid confirmation code" });
    if (error.name === "ExpiredCodeException")
      return res.status(400).json({ success: false, error: "Confirmation code expired" });
    res.status(500).json({ success: false, error: error.message || "Verification failed" });
  }
});

// PATCH /api/register/resend
router.patch("/resend", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email is required" });

    await cognito.send(
      new ResendConfirmationCodeCommand({
        ClientId: CLIENT_ID,
        Username: email,
        SecretHash: getSecretHash(email),
      })
    );

    res.json({ success: true, message: "Verification code resent successfully" });
  } catch (error: any) {
    console.error("Resend Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to resend code" });
  }
});

export default router;
