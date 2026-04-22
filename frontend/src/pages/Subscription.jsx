import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  CheckCircle, CreditCard, AlertCircle,
  RefreshCw, Star, Heart, Trophy, ArrowRight
} from "lucide-react";

const PLANS = [
  {
    key: "monthly",
    label: "Monthly",
    price: "₹1,000",
    per: "/month",
    features: [
      "Score entry & tracking",
      "Monthly draw entry",
      "Charity contribution",
      "Winner eligibility",
    ],
  },
  {
    key: "yearly",
    label: "Yearly",
    price: "₹9,000",
    per: "/year",
    badge: "Save ₹3,000",
    features: [
      "Everything in Monthly",
      "2 months free",
      "Priority winner verification",
      "Early draw access",
    ],
  },
];

// ── ACTIVE STATE UI ───────────────────────────────────────────
const ActivePanel = ({ subscription, onCancel }) => {
  const navigate = useNavigate();

  const shortcuts = [
    { label: "Add Score",      icon: Star,    path: "/score",      color: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" },
    { label: "Pick Charity",   icon: Heart,   path: "/charities",  color: "bg-red-400/10 text-red-400 border-red-400/20" },
    { label: "View Draw",      icon: Trophy,  path: "/draw",       color: "bg-blue-400/10 text-blue-400 border-blue-400/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Active badge */}
      <div className="bg-green-400/10 border border-green-400/30 rounded-2xl p-6 flex items-start gap-4">
        <div className="w-12 h-12 bg-green-400/20 rounded-xl flex items-center justify-center shrink-0">
          <CheckCircle size={24} className="text-green-400" />
        </div>
        <div className="flex-1">
          <p className="text-green-300 font-semibold text-lg">Subscription Active</p>
          <p className="text-green-400/70 text-sm mt-1 capitalize">
            {subscription?.plan} plan · Renews{" "}
            {subscription?.renewalDate
              ? new Date(subscription.renewalDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric",
                })
              : "—"}
          </p>
          <p className="text-green-400/60 text-xs mt-1">
            ₹{subscription?.price?.toLocaleString("en-IN")} paid
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-red-400 text-xs hover:underline shrink-0 mt-1"
        >
          Cancel
        </button>
      </div>

      {/* What's unlocked */}
      <div>
        <p className="text-gray-400 text-sm mb-3 font-medium">Now available for you</p>
        <div className="grid grid-cols-3 gap-3">
          {shortcuts.map(({ label, icon: Icon, path, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:scale-105 ${color}`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{label}</span>
              <ArrowRight size={12} className="opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
        <p className="text-white font-medium text-sm">Subscription Details</p>
        {[
          ["Status",   <span className="text-green-400 font-medium">Active</span>],
          ["Plan",     <span className="text-white capitalize">{subscription?.plan}</span>],
          ["Amount",   <span className="text-white">₹{subscription?.price?.toLocaleString("en-IN")}</span>],
          ["Started",  <span className="text-white">{subscription?.startDate ? new Date(subscription.startDate).toLocaleDateString("en-IN") : "—"}</span>],
          ["Renews",   <span className="text-white">{subscription?.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString("en-IN") : "—"}</span>],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between items-center text-sm">
            <span className="text-gray-400">{label}</span>
            {val}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function Subscription() {
  const [subscription, setSubscription]     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [polling, setPolling]               = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const location  = useLocation();
  const { updateUser } = useAuth();

  const fetchSub = useCallback(async () => {
    try {
      const res = await API.get("/subscription");
      setSubscription(res.data);
      // Keep AuthContext in sync so navbar/other pages reflect status
      updateUser({ subscription: res.data });
      return res.data;
    } catch {
      return null;
    }
  }, []);

  // ── Poll until webhook fires and status = active ──────────
  const pollUntilActive = useCallback(() => {
    setPolling(true);
    const toastId = toast.loading("Confirming payment with Stripe...");
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      const data = await fetchSub();

      if (data?.status === "active") {
        clearInterval(interval);
        setPolling(false);
        toast.success("Subscription activated! You're all set 🎉", { id: toastId });
        // Clean URL
        window.history.replaceState({}, "", "/subscription");
      } else if (attempts >= 15) {
        clearInterval(interval);
        setPolling(false);
        toast.error(
          "Payment done but status pending. Refresh in a moment.",
          { id: toastId, duration: 5000 }
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchSub]);

  useEffect(() => {
    fetchSub().finally(() => setLoading(false));

    if (location.search.includes("subscribed=true")) {
      const cleanup = pollUntilActive();
      return cleanup;
    }
  }, []);

  const subscribe = async (plan) => {
    setCheckoutLoading(plan);
    try {
      const res = await API.post("/subscription/checkout", { plan });
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Checkout failed");
      setCheckoutLoading(null);
    }
  };

  const cancel = async () => {
    if (!confirm("Cancel your subscription? You'll lose access at renewal.")) return;
    try {
      await API.post("/subscription/cancel");
      toast.success("Subscription cancelled");
      fetchSub();
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const isActive = subscription?.status === "active";

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Subscription</h1>
            <p className="text-gray-400 mt-1">
              {isActive
                ? "Your subscription is active. All features are unlocked."
                : "Subscribe to enter scores, join draws, and support your charity."}
            </p>
          </div>

          {/* ── ACTIVE VIEW ── */}
          {isActive && (
            <ActivePanel subscription={subscription} onCancel={cancel} />
          )}

          {/* ── POLLING (payment just made, waiting for webhook) ── */}
          {!isActive && polling && (
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-6 flex items-center gap-4 mb-6">
              <RefreshCw size={22} className="text-yellow-400 animate-spin shrink-0" />
              <div>
                <p className="text-yellow-300 font-medium">Confirming your payment...</p>
                <p className="text-yellow-400/60 text-sm mt-0.5">
                  This takes a few seconds. Please wait.
                </p>
              </div>
            </div>
          )}

          {/* ── INACTIVE — show plans ── */}
          {!isActive && !polling && (
            <>
              {/* Inactive banner */}
              {subscription && subscription.status !== "inactive" && (
                <div className="bg-red-400/10 border border-red-400/30 rounded-2xl p-4 flex items-center gap-3 mb-6">
                  <AlertCircle size={18} className="text-red-400 shrink-0" />
                  <p className="text-red-300 text-sm capitalize">
                    Subscription {subscription.status} — choose a plan below to reactivate
                  </p>
                </div>
              )}

              {/* Plan cards */}
              <div className="grid md:grid-cols-2 gap-5">
                {PLANS.map((plan) => (
                  <div
                    key={plan.key}
                    className={`relative bg-gray-900 border rounded-2xl p-6 ${
                      plan.key === "yearly"
                        ? "border-yellow-400/40"
                        : "border-gray-800"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-5 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    )}

                    <h3 className="text-lg font-bold text-white mb-1">{plan.label}</h3>
                    <div className="mb-5">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400 text-sm">{plan.per}</span>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                          <CheckCircle size={14} className="text-green-400 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => subscribe(plan.key)}
                      disabled={!!checkoutLoading}
                      className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 ${
                        plan.key === "yearly"
                          ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                          : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
                      }`}
                    >
                      <CreditCard size={15} />
                      {checkoutLoading === plan.key
                        ? "Redirecting to Stripe..."
                        : `Subscribe ${plan.label}`}
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-center text-gray-600 text-xs mt-6">
                Powered by Stripe · PCI-compliant · Cancel anytime
              </p>
            </>
          )}

        </div>
      </div>
    </>
  );
}
