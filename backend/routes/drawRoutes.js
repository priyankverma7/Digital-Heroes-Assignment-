import express from "express";
import {
  createDraw,
  simulateDraw,
  publishDraw,
  getLatestDraw,
  getAllDraws,
  verifyWinner,
  markPayout,
  uploadProof,
} from "../controllers/drawController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

// ─── USER ─────────────────────────────────────────────────────
router.get("/latest", authMiddleware, getLatestDraw);
router.post("/proof", authMiddleware, uploadProof);

// ─── ADMIN ────────────────────────────────────────────────────
router.post("/create", authMiddleware, roleMiddleware("admin"), createDraw);
router.post("/simulate", authMiddleware, roleMiddleware("admin"), simulateDraw);
router.put("/:id/publish", authMiddleware, roleMiddleware("admin"), publishDraw);
router.get("/all", authMiddleware, roleMiddleware("admin"), getAllDraws);
router.post("/verify", authMiddleware, roleMiddleware("admin"), verifyWinner);
router.post("/payout", authMiddleware, roleMiddleware("admin"), markPayout);

export default router;
