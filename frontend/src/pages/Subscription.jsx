import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { CheckCircle, CreditCard, AlertCircle, RefreshCw } from "lucide-react";
import { useLocation } from "react-router-dom";

const PLANS = [
  {
    key: "monthly",
    label: "Monthly",
    price: "₹1,000",
    per: "/month",
    features: ["Score entry & tracking", "Monthly draw entry", "Charity contribution", "Winner eligibility"],
  },
  {
    key: "yearly",
    label: "Yearly",
    price: "₹9,000",
    per: "/year",
    badge: "Save ₹3,000",
    features: ["Everything in Monthly", "2 months free", "Priority winner verification", "Early draw access"],
  },
];

export default function Subscription() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [polling, setPolling]           = useState(false);
  const location = useLocation();

  const fetchSub = useCallback(async () => {
    try {
      const res = await API.get("/subscription");
      setSubscription(res.data);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchSub().finally(() => setLoading(false));

    // Coming back from Stripe — poll until webhook fires and status becomes active
    if (location.search.includes("subscribed=true")) {
      setPolling(true);
      toast.loading("Confirming payment...", { id: "sub-confirm" });

      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const data = await fetchSub();

        if (data?.status === "active") {
          clearInterval(interval);
          setPolling(false);
          toast.success("Subscription activated! 🎉", { id: "sub-confirm" });
          // Clean URL
          window.history.replaceState({}, "", "/subscription");
        } else if (attempts >= 10) {
          // Give up after 10 attempts (~20 seconds)
          clearInterval(interval);
          setPolling(false);
          toast.error("Payment received but status not updated yet. Refresh in a moment.", { id: "sub-confirm" });
        }
      }, 2000); // poll every 2 seconds

      return () => clearInterval(interval);
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white">Choose Your Plan</h1>
            <p className="text-gray-400 mt-2">Subscribe to enter scores, join monthly draws, and support your charity</p>
          </div>

          {/* Status banner */}
          {!loading && subscription && (
            <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 ${
              isActive ? "bg-green-400/10 border-green-400/30" : "bg-red-400/10 border-red-400/30"
            }`}>
              {polling ? (
                <RefreshCw size={20} className="text-yellow-400 shrink-0 animate-spin" />
              ) : isActive ? (
                <CheckCircle size={20} className="text-green-400 shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-red-400 shrink-0" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${isActive ? "text-green-300" : polling ? "text-yellow-300" : "text-red-300"}`}>
                  {polling
                    ? "Confirming payment..."
                    : isActive
                    ? "Active subscription"
                    : `Subscription ${subscription?.status || "inactive"}`}
                </p>
                {isActive && (
                  <p className="text-green-400/70 text-sm">
                    {subscription.plan} plan · Renews {new Date(subscription.renewalDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              {isActive && (
                <button onClick={cancel} className="text-red-400 text-sm hover:underline">
                  Cancel
                </button>
              )}
            </div>
          )}

          {/* Plans */}
          <div className="grid md:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.key} className={`relative bg-gray-900 border rounded-2xl p-7 ${
                plan.key === "yearly" ? "border-yellow-400/50" : "border-gray-800"
              }`}>
                {plan.badge && (
                  <span className="absolute -top-3 left-6 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <h3 className="text-xl font-bold text-white">{plan.label}</h3>
                <div className="mt-2 mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">{plan.per}</span>
                </div>

                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                      <CheckCircle size={15} className="text-green-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => subscribe(plan.key)}
                  disabled={!!checkoutLoading || isActive || polling}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 ${
                    plan.key === "yearly"
                      ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
                      : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  <CreditCard size={16} />
                  {checkoutLoading === plan.key
                    ? "Redirecting..."
                    : isActive
                    ? "Current Plan"
                    : `Subscribe ${plan.label}`}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            Powered by Stripe · Secure PCI-compliant payment · Cancel anytime
          </p>
        </div>
      </div>
    </>
  );
}
