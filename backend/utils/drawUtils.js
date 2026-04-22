import Score from "../models/Score.js";

// ─── RANDOM DRAW (1–45, matching score range) ────────────────
export const generateRandomNumbers = () => {
  const set = new Set();
  while (set.size < 5) {
    set.add(Math.floor(Math.random() * 45) + 1);
  }
  return [...set];
};

// ─── ALGORITHMIC DRAW (PRD §06: weighted by most/least frequent) ─
export const generateAlgorithmicNumbers = async () => {
  const scores = await Score.find();

  const freq = {};
  scores.forEach((s) => {
    s.numbers.forEach((n) => {
      freq[n] = (freq[n] || 0) + 1;
    });
  });

  if (Object.keys(freq).length < 5) {
    // Not enough data — fall back to random
    return generateRandomNumbers();
  }

  // Sort by frequency descending and pick from top weighted numbers
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([num]) => Number(num));

  const result = [];
  const pool = sorted.slice(0, Math.min(20, sorted.length));

  while (result.length < 5) {
    const idx = Math.floor(Math.random() * pool.length);
    const val = pool[idx];
    if (!result.includes(val)) result.push(val);
  }

  return result;
};

// ─── MATCH COUNT ─────────────────────────────────────────────
export const getMatchCount = (drawNumbers, userNumbers) => {
  return userNumbers.filter((n) => drawNumbers.includes(n)).length;
};
