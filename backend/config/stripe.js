import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.error("❌ STRIPE_SECRET_KEY is missing");
  process.exit(1);
}

const stripe = new Stripe(key);

export default stripe;
