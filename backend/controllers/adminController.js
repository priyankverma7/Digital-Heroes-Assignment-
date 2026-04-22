import User from "../models/User.js";
import Draw from "../models/Draw.js";
import Score from "../models/Score.js";
import Charity from "../models/Charity.js";

// ─── GET ALL USERS ───────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("charity.charityId", "name");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET SINGLE USER ─────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("charity.charityId", "name");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── BLOCK USER ──────────────────────────────────────────────
export const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User blocked", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── UNBLOCK USER ────────────────────────────────────────────
export const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User unblocked", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE USER ─────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Score.deleteMany({ userId: req.params.id });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── UPDATE SUBSCRIPTION (manual override) ───────────────────
export const updateSubscription = async (req, res) => {
  try {
    const { userId, status, plan } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { "subscription.status": status, "subscription.plan": plan },
      { new: true }
    ).select("-password");

    res.json({ message: "Subscription updated", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── EDIT USER SCORES (PRD §11) ──────────────────────────────
export const editUserScore = async (req, res) => {
  try {
    const { numbers } = req.body;

    if (!numbers || numbers.length !== 5)
      return res.status(400).json({ message: "Exactly 5 numbers required" });

    const invalid = numbers.some((n) => n < 1 || n > 45);
    if (invalid)
      return res.status(400).json({ message: "Scores must be between 1 and 45" });

    const score = await Score.findByIdAndUpdate(
      req.params.scoreId,
      { numbers },
      { new: true }
    );
    if (!score) return res.status(404).json({ message: "Score not found" });

    res.json({ message: "Score updated", score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET ALL DRAWS ───────────────────────────────────────────
export const getAllDraws = async (req, res) => {
  try {
    const draws = await Draw.find().sort({ createdAt: -1 });
    res.json(draws);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET ALL WINNERS ─────────────────────────────────────────
export const getAllWinners = async (req, res) => {
  try {
    const draws = await Draw.find({ status: "published" })
      .populate("winners.match5.userId", "name email")
      .populate("winners.match4.userId", "name email")
      .populate("winners.match3.userId", "name email")
      .sort({ createdAt: -1 });

    const winners = draws.flatMap((draw) => {
      const all = [];
      ["match5", "match4", "match3"].forEach((tier) => {
        draw.winners[tier].forEach((w) => {
          all.push({
            ...w.toObject(),
            tier,
            month: draw.month,
            drawId: draw._id,
          });
        });
      });
      return all;
    });

    res.json(winners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── ANALYTICS (PRD §11) ─────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const activeUsers = await User.countDocuments({ "subscription.status": "active" });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const totalDraws = await Draw.countDocuments();
    const publishedDraws = await Draw.countDocuments({ status: "published" });
    const totalScores = await Score.countDocuments();
    const totalCharities = await Charity.countDocuments();

    // Total prize pool distributed
    const draws = await Draw.find({ status: "published" });
    const totalPrizeDistributed = draws.reduce((sum, d) => sum + (d.prizePool || 0), 0);

    // Total charity contributions from subscriptions
    const users = await User.find({ "subscription.status": "active" });
    let totalCharityContributions = 0;
    users.forEach((u) => {
      const price = u.subscription?.price || 0;
      const pct = u.charity?.contributionPercent || 10;
      totalCharityContributions += (price * pct) / 100;
    });

    res.json({
      totalUsers,
      activeUsers,
      blockedUsers,
      totalDraws,
      publishedDraws,
      totalScores,
      totalCharities,
      totalPrizeDistributed,
      totalCharityContributions: Math.round(totalCharityContributions),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
