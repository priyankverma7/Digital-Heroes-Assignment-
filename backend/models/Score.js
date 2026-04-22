import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Stableford format: 1–45
    numbers: {
      type: [Number],
      validate: {
        validator: (arr) =>
          arr.length === 5 && arr.every((n) => n >= 1 && n <= 45),
        message: "Exactly 5 numbers between 1 and 45 required",
      },
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate score for same user on same date
scoreSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("Score", scoreSchema);
