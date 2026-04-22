import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  description: String,
  location: String,
});

const charitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: "" },
    category: {
      type: String,
      enum: ["health", "education", "environment", "animals", "other"],
      default: "other",
    },
    isFeatured: { type: Boolean, default: false },
    donationReceived: { type: Number, default: 0 },
    totalContributions: { type: Number, default: 0 }, // from subscriptions
    events: [eventSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Charity", charitySchema);
