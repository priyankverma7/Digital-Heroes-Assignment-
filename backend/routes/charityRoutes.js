import express from "express";
import {
  getAllCharities,
  getCharityById,
  getFeaturedCharities,
  donateToCharity,
  selectCharity,
  getUserCharity,
  createCharity,
  updateCharity,
  deleteCharity,
} from "../controllers/charityController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

// ─── PUBLIC ──────────────────────────────────────────────────
router.get("/", getAllCharities);
router.get("/featured", getFeaturedCharities);

// ─── USER (authenticated) ─────────────────────────────────────
// IMPORTANT: /my MUST be before /:id or Express matches "my" as an id
router.get("/my", authMiddleware, getUserCharity);
router.post("/select", authMiddleware, selectCharity);
router.post("/:id/donate", authMiddleware, donateToCharity);

// ─── SINGLE CHARITY (public) ──────────────────────────────────
router.get("/:id", getCharityById);

// ─── ADMIN ────────────────────────────────────────────────────
router.post("/", authMiddleware, roleMiddleware("admin"), createCharity);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateCharity);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteCharity);

export default router;
