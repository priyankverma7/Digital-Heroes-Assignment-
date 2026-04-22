import stripe from "../config/stripe.js";
import User from "../models/User.js";

// PRD §04: Monthly = ₹1000, Yearly = ₹10000 (discounted)
const PLANS = {
  monthly: { amount: 100000, label: "Monthly Subscription" }, // paise (₹1000)
  yearly:  { amount: 900000, label: "Yearly Subscription" },  // paise (₹9000 — discounted)
};

// ─── CREATE STRIPE CHECKOUT SESSION ──────────────────────────
export const createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PLANS[plan])
      return res.status(400).json({ message: "Invalid plan. Choose monthly or yearly." });

    const { amount, label } = PLANS[plan];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: req.user.email,
      metadata: {
        userId: req.user._id.toString(),
        plan,
      },
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: label },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.CLIENT_URL}/subscription`,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET CURRENT SUBSCRIPTION ────────────────────────────────
export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("subscription");
    res.json(user.subscription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── CANCEL SUBSCRIPTION ─────────────────────────────────────
export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.subscription.status = "cancelled";
    await user.save({ validateBeforeSave: false });
    res.json({ message: "Subscription cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

