import Score from "../models/Score.js";

// ─── ADD SCORE ───────────────────────────────────────────────
// PRD §05: 5 numbers (1–45 Stableford), one per date, rolling 5-score cap
export const addScore = async (req, res) => {
  try {
    const { numbers, date } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!numbers || !Array.isArray(numbers) || numbers.length !== 5)
      return res.status(400).json({ message: "Enter exactly 5 numbers" });

    const invalid = numbers.some((n) => n < 1 || n > 45);
    if (invalid)
      return res.status(400).json({ message: "Each score must be between 1 and 45 (Stableford)" });

    if (!date)
      return res.status(400).json({ message: "Date is required" });

    // Normalize date to midnight UTC to prevent time-zone duplicates
    const normalized = new Date(date);
    normalized.setUTCHours(0, 0, 0, 0);

    const score = new Score({ userId, numbers, date: normalized });
    await score.save();

    // ─── ROLLING 5-SCORE CAP (PRD §05) ───────────────────────
    // After saving, if user has more than 5 scores, delete the oldest
    const count = await Score.countDocuments({ userId });
    if (count > 5) {
      const oldest = await Score.findOne({ userId }).sort({ date: 1 });
      await Score.findByIdAndDelete(oldest._id);
    }

    res.status(201).json({ message: "Score added", score });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: "A score already exists for this date. Edit or delete it." });
    res.status(500).json({ message: err.message });
  }
};

// ─── GET SCORES ──────────────────────────────────────────────
// PRD §05: display in reverse chronological order
export const getScores = async (req, res) => {
  try {
    const scores = await Score.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(scores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── UPDATE SCORE ────────────────────────────────────────────
// PRD §13: existing entry for a date may be edited
export const updateScore = async (req, res) => {
  try {
    const { numbers } = req.body;
    const userId = req.user._id;

    if (!numbers || numbers.length !== 5)
      return res.status(400).json({ message: "Enter exactly 5 numbers" });

    const invalid = numbers.some((n) => n < 1 || n > 45);
    if (invalid)
      return res.status(400).json({ message: "Each score must be between 1 and 45" });

    const score = await Score.findOne({ _id: req.params.id, userId });
    if (!score) return res.status(404).json({ message: "Score not found" });

    score.numbers = numbers;
    await score.save();

    res.json({ message: "Score updated", score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── DELETE SCORE ────────────────────────────────────────────
export const deleteScore = async (req, res) => {
  try {
    const score = await Score.findOne({ _id: req.params.id, userId: req.user._id });
    if (!score) return res.status(404).json({ message: "Score not found" });

    await Score.findByIdAndDelete(req.params.id);
    res.json({ message: "Score deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
