import mongoose from "mongoose";

const winnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  scoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Score" },
  prize: Number,
  // Winner verification (PRD §09)
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  proofUrl: { type: String, default: null },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
});

const drawSchema = new mongoose.Schema(
  {
    numbers: { type: [Number], required: true },
    month: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "simulated", "published"],
      default: "draft",
    },
    drawType: {
      type: String,
      enum: ["random", "algorithmic"],
      default: "random",
    },
    prizePool: { type: Number, default: 0 },
    winners: {
      match5: [winnerSchema],
      match4: [winnerSchema],
      match3: [winnerSchema],
    },
    // Jackpot carry forward if no match5 winner (PRD §06)
    jackpotCarryForward: { type: Number, default: 0 },
    totalParticipants: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Draw", drawSchema);
