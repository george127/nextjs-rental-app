import express from "express";

const router = express.Router();

router.post("/", async (req, res) => {
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;
