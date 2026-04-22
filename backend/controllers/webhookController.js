import stripe from "../config/stripe.js";
import User from "../models/User.js";

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;

    const user = await User.findById(userId);
    if (!user) return res.json({ received: true });

    const now = new Date();
    const renewalDate = new Date(now);

    if (plan === "yearly") {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    } else {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    }

    user.subscription = {
      status: "active",
      plan,
      price: session.amount_total / 100, // convert paise to rupees
      startDate: now,
      renewalDate,
      stripeSessionId: session.id,
    };

    // Enable draw eligibility
    user.isEligibleForDraw = true;

    await user.save({ validateBeforeSave: false });
    console.log(`✅ Subscription activated for user ${userId} — plan: ${plan}`);
  }

  res.json({ received: true });
};
