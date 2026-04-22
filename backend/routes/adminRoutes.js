import express from "express";
import {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser,
  updateSubscription,
  editUserScore,
  getAllDraws,
  getAllWinners,
  getAnalytics,
} from "../controllers/adminController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

// All admin routes require auth + admin role
router.use(authMiddleware, roleMiddleware("admin"));

// ─── USERS ────────────────────────────────────────────────────
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/block/:id", blockUser);
router.put("/unblock/:id", unblockUser);
router.delete("/delete/:id", deleteUser);
router.put("/subscription", updateSubscription);

// ─── SCORES ───────────────────────────────────────────────────
router.put("/scores/:scoreId", editUserScore);

// ─── DRAWS ────────────────────────────────────────────────────
router.get("/draws", getAllDraws);
router.get("/winners", getAllWinners);

// ─── ANALYTICS ────────────────────────────────────────────────
router.get("/analytics", getAnalytics);

export default router;
