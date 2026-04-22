import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // 🔐 SUBSCRIPTION
    subscription: {
      status: {
        type: String,
        enum: ["active", "inactive", "cancelled", "expired"],
        default: "inactive",
      },
      plan: {
        type: String,
        enum: ["monthly", "yearly", null],
        default: null,
      },
      price: { type: Number, default: 0 },
      startDate: Date,
      renewalDate: Date,
      stripeCustomerId: String,
      stripeSessionId: String,
    },

    // ❤️ CHARITY
    charity: {
      charityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Charity",
        default: null,
      },
      contributionPercent: {
        type: Number,
        min: 10,
        max: 100,
        default: 10,
      },
      selectedAt: {
        type: Date,
        default: null,
      },
    },

    // 🎯 DRAW ELIGIBILITY
    isEligibleForDraw: {
      type: Boolean,
      default: false,
    },

    // 🚫 BLOCK STATUS
    isBlocked: {
      type: Boolean,
      default: false,
    },

    lastLogin: Date,
  },
  { timestamps: true }
);

// Hash password only when it changes (model hook — don't hash manually in controller)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export default mongoose.model("User", userSchema);