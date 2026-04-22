// PRD §04: Non-subscribers receive restricted access
export const checkSubscription = (req, res, next) => {
  const sub = req.user?.subscription;

  if (!sub || sub.status !== "active")
    return res.status(403).json({ message: "Active subscription required" });

  if (new Date(sub.renewalDate) < new Date()) {
    return res.status(403).json({ message: "Subscription has expired" });
  }

  next();
};
