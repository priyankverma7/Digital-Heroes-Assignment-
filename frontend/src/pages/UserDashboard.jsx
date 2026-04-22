import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  CreditCard, Heart, Trophy, Star, AlertCircle,
  CheckCircle, TrendingUp, Award
} from "lucide-react";

const StatCard = ({ icon: Icon, label, value, accent = "yellow" }) => {
  const colors = {
    yellow: "text-yellow-400 bg-yellow-400/10",
    green:  "text-green-400 bg-green-400/10",
    blue:   "text-blue-400 bg-blue-400/10",
    red:    "text-red-400 bg-red-400/10",
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[accent]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
    </div>
  );
};

const UserDashboard = ({ user }) => {
  const [scores, setScores]           = useState([]);
  const [charity, setCharity]         = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [latestDraw, setLatestDraw]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const { logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const loadData = async () => {
    try {
      const [subRes, charityRes] = await Promise.all([
        API.get("/subscription"),
        API.get("/charities/my"),
      ]);
      setSubscription(subRes.data);
      setCharity(charityRes.data);

      // Sync fresh subscription into AuthContext so navbar/other components update
      updateUser({ subscription: subRes.data });

      // Scores only if active
      if (subRes.data?.status === "active") {
        const [scoreRes, drawRes] = await Promise.all([
          API.get("/scores"),
          API.get("/draw/latest").catch(() => ({ data: null })),
        ]);
        setScores(scoreRes.data || []);
        setLatestDraw(drawRes.data);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Stripe redirects back with ?subscribed=true — show toast and clean URL
    if (location.search.includes("subscribed=true")) {
      toast.success("Subscription activated! Welcome aboard 🎉");
      window.history.replaceState({}, "", "/dashboard");
    }
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const isActive = subscription?.status === "active";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  // Check if current user is a winner in latest draw
  const myWinnings = (() => {
    if (!latestDraw) return null;
    const tiers = ["match5", "match4", "match3"];
    for (const tier of tiers) {
      const w = latestDraw.winners?.[tier]?.find(
        (w) => w.userId?._id === user._id || w.userId === user._id
      );
      if (w) return { tier, prize: w.prize, status: w.paymentStatus, verificationStatus: w.verificationStatus };
    }
    return null;
  })();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">

          {/* ── HEADER ─────────────────────────────────────────── */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {user?.name?.split(" ")[0]} 👋
              </h1>
              <p className="text-gray-400 mt-1">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* ── SUBSCRIPTION BANNER ────────────────────────────── */}
          {!isActive && (
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle size={20} className="text-yellow-400 shrink-0" />
              <div className="flex-1">
                <p className="text-yellow-300 font-medium">Subscription required</p>
                <p className="text-yellow-400/70 text-sm">Subscribe to enter scores and participate in draws.</p>
              </div>
              <button
                onClick={() => navigate("/subscription")}
                className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-colors"
              >
                Subscribe Now
              </button>
            </div>
          )}

          {/* ── STAT CARDS ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={CreditCard} label="Subscription"
              value={subscription?.status || "inactive"}
              accent={isActive ? "green" : "red"} />
            <StatCard icon={Star} label="Total Scores"
              value={scores.length}
              accent="yellow" />
            <StatCard icon={Heart} label="Charity"
              value={charity?.charityId?.name || "None selected"}
              accent="blue" />
            <StatCard icon={TrendingUp} label="Contribution"
              value={charity?.contributionPercent ? `${charity.contributionPercent}%` : "—"}
              accent="green" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* ── SUBSCRIPTION DETAIL ─────────────────────────── */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-yellow-400" /> Subscription
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                    isActive ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                  }`}>
                    {subscription?.status || "inactive"}
                  </span>
                </div>

                {subscription?.plan && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Plan</span>
                    <span className="text-white text-sm capitalize">{subscription.plan}</span>
                  </div>
                )}

                {subscription?.renewalDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Renewal</span>
                    <span className="text-white text-sm">
                      {new Date(subscription.renewalDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {subscription?.price && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Amount</span>
                    <span className="text-white text-sm">₹{subscription.price}</span>
                  </div>
                )}

                {!isActive && (
                  <button
                    onClick={() => navigate("/subscription")}
                    className="w-full mt-2 bg-yellow-400 text-gray-900 font-semibold py-2 rounded-xl text-sm hover:bg-yellow-300 transition-colors"
                  >
                    Subscribe
                  </button>
                )}
              </div>
            </div>

            {/* ── CHARITY ─────────────────────────────────────── */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Heart size={18} className="text-red-400" /> Your Charity
              </h3>

              {charity?.charityId ? (
                <div className="space-y-3">
                  <p className="text-white font-medium">{charity.charityId.name}</p>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Contribution</span>
                    <span className="text-green-400 text-sm font-medium">{charity.contributionPercent}%</span>
                  </div>
                  {subscription?.price && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Monthly amount</span>
                      <span className="text-white text-sm">
                        ₹{Math.round((subscription.price * charity.contributionPercent) / 100)}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => navigate("/charities")}
                    className="w-full mt-2 bg-gray-800 text-gray-300 py-2 rounded-xl text-sm hover:bg-gray-700 transition-colors"
                  >
                    Change Charity
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-400 text-sm mb-4">No charity selected yet</p>
                  <button
                    onClick={() => navigate("/charities")}
                    className="w-full bg-red-500/10 text-red-400 border border-red-500/30 py-2 rounded-xl text-sm hover:bg-red-500/20 transition-colors"
                  >
                    Select a Charity
                  </button>
                </div>
              )}
            </div>

            {/* ── DRAW / WINNINGS ─────────────────────────────── */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-400" /> Latest Draw
              </h3>

              {latestDraw ? (
                <div className="space-y-3">
                  <p className="text-gray-400 text-sm">{latestDraw.month}</p>

                  <div className="flex flex-wrap gap-2">
                    {latestDraw.numbers?.map((n, i) => (
                      <span key={i} className="w-9 h-9 flex items-center justify-center bg-yellow-400 text-gray-900 rounded-full text-sm font-bold">
                        {n}
                      </span>
                    ))}
                  </div>

                  {myWinnings ? (
                    <div className="bg-green-400/10 border border-green-400/30 rounded-xl p-3">
                      <p className="text-green-400 font-semibold text-sm flex items-center gap-1">
                        <Award size={14} /> You won! ({myWinnings.tier})
                      </p>
                      <p className="text-white font-bold mt-1">₹{myWinnings.prize?.toLocaleString()}</p>
                      <p className="text-gray-400 text-xs mt-1 capitalize">
                        Verification: {myWinnings.verificationStatus} · Payment: {myWinnings.status}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No win this draw</p>
                  )}

                  <button
                    onClick={() => navigate("/draw")}
                    className="w-full bg-gray-800 text-gray-300 py-2 rounded-xl text-sm hover:bg-gray-700 transition-colors"
                  >
                    View Full Draw
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No draw published yet</p>
              )}
            </div>
          </div>

          {/* ── SCORES ─────────────────────────────────────────── */}
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Star size={18} className="text-yellow-400" /> Recent Scores
              </h3>
              {isActive && (
                <button
                  onClick={() => navigate("/score")}
                  className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-colors"
                >
                  Add Score
                </button>
              )}
            </div>

            {!isActive ? (
              <p className="text-gray-500 text-center py-8">Subscribe to view and enter scores</p>
            ) : scores.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No scores yet. Start playing! 🎯</p>
            ) : (
              <div className="space-y-3">
                {scores.map((s) => (
                  <div key={s._id} className="flex justify-between items-center border border-gray-800 rounded-xl p-4 hover:bg-gray-800/50 transition-colors">
                    <div>
                      <div className="flex gap-2 mb-1">
                        {s.numbers?.map((n, i) => (
                          <span key={i} className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded-lg text-sm font-medium">
                            {n}
                          </span>
                        ))}
                      </div>
                      <p className="text-gray-500 text-xs">{new Date(s.date).toDateString()}</p>
                    </div>
                    <CheckCircle size={18} className="text-green-400" />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default UserDashboard;
