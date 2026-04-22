import Charity from "../models/Charity.js";
import User from "../models/User.js";

// ─── GET ALL CHARITIES (search + filter) ─────────────────────
export const getAllCharities = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};

    if (search) query.name = { $regex: search, $options: "i" };
    if (category) query.category = category;

    const charities = await Charity.find(query).sort({ isFeatured: -1, createdAt: -1 });
    res.json(charities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET SINGLE CHARITY ──────────────────────────────────────
export const getCharityById = async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) return res.status(404).json({ message: "Charity not found" });
    res.json(charity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── FEATURED CHARITIES ──────────────────────────────────────
export const getFeaturedCharities = async (req, res) => {
  try {
    const charities = await Charity.find({ isFeatured: true });
    res.json(charities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── INDEPENDENT DONATION ────────────────────────────────────
export const donateToCharity = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0)
      return res.status(400).json({ message: "Invalid donation amount" });

    const charity = await Charity.findById(req.params.id);
    if (!charity) return res.status(404).json({ message: "Charity not found" });

    charity.donationReceived += Number(amount);
    await charity.save();

    res.json({ message: "Donation successful", charity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── SELECT CHARITY (PRD §08) ─────────────────────────────────
// Min 10% contribution of subscription fee
export const selectCharity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { charityId, percentage } = req.body;

    if (!charityId) return res.status(400).json({ message: "Charity ID required" });

    // PRD §08: minimum 10%
    const pct = Number(percentage) || 10;
    if (pct < 10 || pct > 100)
      return res.status(400).json({ message: "Contribution must be between 10% and 100%" });

    const charity = await Charity.findById(charityId);
    if (!charity) return res.status(404).json({ message: "Charity not found" });

    const user = await User.findById(userId);
    user.charity = {
      charityId,
      contributionPercent: pct,
      selectedAt: new Date(),
    };
    await user.save({ validateBeforeSave: false });

    res.json({ message: "Charity selected successfully", charity: user.charity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET USER'S SELECTED CHARITY ─────────────────────────────
export const getUserCharity = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("charity.charityId");
    res.json(user.charity || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── ADMIN: CREATE CHARITY ───────────────────────────────────
export const createCharity = async (req, res) => {
  try {
    const charity = await Charity.create(req.body);
    res.status(201).json(charity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── ADMIN: UPDATE CHARITY ───────────────────────────────────
export const updateCharity = async (req, res) => {
  try {
    const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!charity) return res.status(404).json({ message: "Charity not found" });
    res.json(charity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── ADMIN: DELETE CHARITY ───────────────────────────────────
export const deleteCharity = async (req, res) => {
  try {
    await Charity.findByIdAndDelete(req.params.id);
    res.json({ message: "Charity deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
