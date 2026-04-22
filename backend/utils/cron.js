import cron from "node-cron";
import User from "../models/User.js";

// Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const users = await User.find({ "subscription.status": "active" });

    let expiredCount = 0;
    for (const user of users) {
      if (user.subscription?.renewalDate && new Date(user.subscription.renewalDate) < new Date()) {
        user.subscription.status = "expired";
        user.isEligibleForDraw = false;
        await user.save({ validateBeforeSave: false });
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      console.log(`⏰ Cron: ${expiredCount} subscriptions expired`);
    }
  } catch (err) {
    console.error("Cron error:", err.message);
  }
});

console.log("⏰ Subscription expiry cron job scheduled");
