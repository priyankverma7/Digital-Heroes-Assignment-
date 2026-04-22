import express from "express";
import { addScore, getScores, updateScore, deleteScore } from "../controllers/scoreController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { checkSubscription } from "../middlewares/subscriptionMiddleware.js";

const router = express.Router();

// authMiddleware MUST come before checkSubscription
router.post("/add", authMiddleware, checkSubscription, addScore);
router.get("/", authMiddleware, checkSubscription, getScores);
router.put("/:id", authMiddleware, checkSubscription, updateScore);
router.delete("/:id", authMiddleware, deleteScore);

export default router;
