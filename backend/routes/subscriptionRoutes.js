import express from "express";
import {
  createCheckoutSession,
  getSubscription,
  cancelSubscription,
} from "../controllers/subscriptionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getSubscription);
router.post("/checkout", authMiddleware, createCheckoutSession);
router.post("/cancel", authMiddleware, cancelSubscription);
// TEMP: manual activate for testing — remove before production
router.post("/activate-test", authMiddleware, async (req, res) => {
  const { plan = "monthly" } = req.body;
  const now = new Date();
  const renewal = new Date(now);
  renewal.setMonth(renewal.getMonth() + (plan === "yearly" ? 12 : 1));

  await User.findByIdAndUpdate(req.user._id, {
    subscription: {
      status: "active",
      plan,
      price: plan === "yearly" ? 9000 : 1000,
      startDate: now,
      renewalDate: renewal,
    },
    isEligibleForDraw: true,
  });

  res.json({ message: "Subscription activated for testing" });
});

export default router;
