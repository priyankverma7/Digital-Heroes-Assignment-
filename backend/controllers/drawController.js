import Draw from "../models/Draw.js";
import Score from "../models/Score.js";
import User from "../models/User.js";
import { generateRandomNumbers, generateAlgorithmicNumbers, getMatchCount } from "../utils/drawUtils.js";

// ─── PRIZE POOL CALCULATION (PRD §07) ────────────────────────
// A fixed portion of each subscription contributes to pool
// Monthly: ₹1000, Yearly: ₹10000 — prize portion is 60% of revenue
const calculatePrizePool = async () => {
  const activeUsers = await User.find({ "subscription.status": "active" });

  let total = 0;
  activeUsers.forEach((u) => {
    const price = u.subscription?.price || 0;
    total += price * 0.6; // 60% of subscription goes to prize pool
  });

  return Math.round(total);
};

// PRD §07: 40% match5, 35% match4, 25% match3
const distributePrizes = (pool, winners, previousCarryForward = 0) => {
  const totalPool = pool + previousCarryForward;

  const shares = {
    match5: totalPool * 0.4,
    match4: totalPool * 0.35,
    match3: totalPool * 0.25,
  };

  return {
    perWinner: {
      match5: winners.match5.length ? shares.match5 / winners.match5.length : 0,
      match4: winners.match4.length ? shares.match4 / winners.match4.length : 0,
      match3: winners.match3.length ? shares.match3 / winners.match3.length : 0,
    },
    // PRD §07: jackpot carries forward if no match5 winner
    newCarryForward: winners.match5.length === 0 ? shares.match5 : 0,
  };
};

// ─── FIND WINNERS FROM SCORES ────────────────────────────────
const findWinners = async (drawNumbers) => {
  const scores = await Score.find().populate("userId", "name email subscription");

  const winners = { match5: [], match4: [], match3: [] };

  scores.forEach((score) => {
    // Only active subscribers eligible
    if (score.userId?.subscription?.status !== "active") return;

    const matchCount = getMatchCount(drawNumbers, score.numbers);
    if (matchCount === 5) winners.match5.push(score);
    else if (matchCount === 4) winners.match4.push(score);
    else if (matchCount === 3) winners.match3.push(score);
  });

  return winners;
};

// ─── CREATE DRAW (ADMIN) ─────────────────────────────────────
export const createDraw = async (req, res) => {
  try {
    const { drawType = "random" } = req.body;

    // Get previous carry forward if any
    const lastDraw = await Draw.findOne({ status: "published" }).sort({ createdAt: -1 });
    const carryForward = lastDraw?.jackpotCarryForward || 0;

    const numbers =
      drawType === "algorithmic"
        ? await generateAlgorithmicNumbers()
        : generateRandomNumbers();

    const prizePool = await calculatePrizePool();
    const winners = await findWinners(numbers);
    const prizes = distributePrizes(prizePool, winners, carryForward);

    const totalParticipants = await Score.countDocuments();

    const draw = await Draw.create({
      numbers,
      month: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
      drawType,
      prizePool: prizePool + carryForward,
      totalParticipants,
      winners: {
        match5: winners.match5.map((s) => ({
          userId: s.userId._id,
          scoreId: s._id,
          prize: prizes.perWinner.match5,
        })),
        match4: winners.match4.map((s) => ({
          userId: s.userId._id,
          scoreId: s._id,
          prize: prizes.perWinner.match4,
        })),
        match3: winners.match3.map((s) => ({
          userId: s.userId._id,
          scoreId: s._id,
          prize: prizes.perWinner.match3,
        })),
      },
      jackpotCarryForward: prizes.newCarryForward,
      status: "draft",
    });

    res.json(draw);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── SIMULATE DRAW (pre-analysis mode, PRD §06) ──────────────
export const simulateDraw = async (req, res) => {
  try {
    const { drawType = "random" } = req.body;

    const lastDraw = await Draw.findOne({ status: "published" }).sort({ createdAt: -1 });
    const carryForward = lastDraw?.jackpotCarryForward || 0;

    const numbers =
      drawType === "algorithmic"
        ? await generateAlgorithmicNumbers()
        : generateRandomNumbers();

    const prizePool = await calculatePrizePool();
    const winners = await findWinners(numbers);
    const prizes = distributePrizes(prizePool, winners, carryForward);

    // Return preview without saving
    res.json({
      numbers,
      drawType,
      prizePool: prizePool + carryForward,
      carryForward,
      winners: {
        match5Count: winners.match5.length,
        match4Count: winners.match4.length,
        match3Count: winners.match3.length,
      },
      prizes: prizes.perWinner,
      newCarryForward: prizes.newCarryForward,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PUBLISH DRAW ────────────────────────────────────────────
export const publishDraw = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ message: "Draw not found" });

    draw.status = "published";
    await draw.save();

    res.json({ message: "Draw published successfully", draw });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET LATEST PUBLISHED DRAW ───────────────────────────────
export const getLatestDraw = async (req, res) => {
  try {
    const draw = await Draw.findOne({ status: "published" })
      .sort({ createdAt: -1 })
      .populate("winners.match5.userId", "name email")
      .populate("winners.match4.userId", "name email")
      .populate("winners.match3.userId", "name email");

    if (!draw) return res.status(404).json({ message: "No draw published yet" });

    res.json(draw);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET ALL DRAWS ───────────────────────────────────────────
export const getAllDraws = async (req, res) => {
  try {
    const draws = await Draw.find().sort({ createdAt: -1 });
    res.json(draws);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── WINNER VERIFICATION (PRD §09) ───────────────────────────
export const verifyWinner = async (req, res) => {
  try {
    const { drawId, winnerId, action } = req.body; // action: approve | reject

    const draw = await Draw.findById(drawId);
    if (!draw) return res.status(404).json({ message: "Draw not found" });

    // Find winner across all tiers
    const tiers = ["match5", "match4", "match3"];
    let found = false;

    for (const tier of tiers) {
      const winner = draw.winners[tier].id(winnerId);
      if (winner) {
        winner.verificationStatus = action === "approve" ? "approved" : "rejected";
        found = true;
        break;
      }
    }

    if (!found) return res.status(404).json({ message: "Winner not found" });

    await draw.save();
    res.json({ message: `Winner ${action}d successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── MARK PAYOUT COMPLETE (PRD §09) ──────────────────────────
export const markPayout = async (req, res) => {
  try {
    const { drawId, winnerId } = req.body;

    const draw = await Draw.findById(drawId);
    if (!draw) return res.status(404).json({ message: "Draw not found" });

    const tiers = ["match5", "match4", "match3"];
    let found = false;

    for (const tier of tiers) {
      const winner = draw.winners[tier].id(winnerId);
      if (winner) {
        winner.paymentStatus = "paid";
        found = true;
        break;
      }
    }

    if (!found) return res.status(404).json({ message: "Winner not found" });

    await draw.save();
    res.json({ message: "Payout marked as complete" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── UPLOAD PROOF (Winner) ────────────────────────────────────
export const uploadProof = async (req, res) => {
  try {
    const { drawId, winnerId, proofUrl } = req.body;

    const draw = await Draw.findById(drawId);
    if (!draw) return res.status(404).json({ message: "Draw not found" });

    const tiers = ["match5", "match4", "match3"];
    let found = false;

    for (const tier of tiers) {
      const winner = draw.winners[tier].id(winnerId);
      if (winner && winner.userId.toString() === req.user._id.toString()) {
        winner.proofUrl = proofUrl;
        found = true;
        break;
      }
    }

    if (!found) return res.status(404).json({ message: "Winner record not found" });

    await draw.save();
    res.json({ message: "Proof uploaded" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
