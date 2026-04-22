import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { Heart, Calendar, MapPin } from "lucide-react";

export default function CharityDetails() {
  const { id } = useParams();
  const [charity, setCharity]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [percentage, setPercentage] = useState(10);
  const [donationAmount, setDonation] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [donating, setDonating]   = useState(false);

  useEffect(() => {
    API.get(`/charities/${id}`)
      .then((res) => setCharity(res.data))
      .catch(() => toast.error("Charity not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const selectCharity = async () => {
    setSelecting(true);
    try {
      await API.post("/charities/select", { charityId: id, percentage });
      toast.success(`${charity.name} selected as your charity!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to select charity");
    } finally {
      setSelecting(false);
    }
  };

  const donate = async () => {
    const amount = Number(donationAmount);
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");
    setDonating(true);
    try {
      await API.post(`/charities/${id}/donate`, { amount });
      toast.success(`₹${amount} donated to ${charity.name}!`);
      setDonation("");
      // Refresh charity
      const res = await API.get(`/charities/${id}`);
      setCharity(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Donation failed");
    } finally {
      setDonating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  );

  if (!charity) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-3xl mx-auto">

          {/* Header image */}
          {charity.image ? (
            <img src={charity.image} alt={charity.name} className="w-full h-56 object-cover rounded-2xl mb-6" />
          ) : (
            <div className="w-full h-56 bg-gray-900 rounded-2xl mb-6 flex items-center justify-center">
              <Heart size={48} className="text-red-400" />
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main info */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <h1 className="text-2xl font-bold text-white">{charity.name}</h1>
                  {charity.isFeatured && (
                    <span className="bg-yellow-400/10 text-yellow-400 text-xs px-3 py-1 rounded-full">Featured</span>
                  )}
                </div>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg capitalize mb-4 inline-block">
                  {charity.category}
                </span>
                <p className="text-gray-300 leading-relaxed">{charity.description}</p>

                {charity.donationReceived > 0 && (
                  <div className="mt-4 p-3 bg-green-400/10 border border-green-400/20 rounded-xl">
                    <p className="text-green-400 text-sm font-medium">
                      ₹{charity.donationReceived?.toLocaleString()} raised total
                    </p>
                  </div>
                )}
              </div>

              {/* Events (PRD §08) */}
              {charity.events?.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-yellow-400" /> Upcoming Events
                  </h3>
                  <div className="space-y-3">
                    {charity.events.map((ev, i) => (
                      <div key={i} className="border border-gray-800 rounded-xl p-4">
                        <p className="text-white font-medium">{ev.title}</p>
                        <p className="text-gray-400 text-sm mt-1">{new Date(ev.date).toDateString()}</p>
                        {ev.location && (
                          <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                            <MapPin size={11} /> {ev.location}
                          </p>
                        )}
                        {ev.description && <p className="text-gray-400 text-sm mt-2">{ev.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {/* Select charity */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-3">Select as My Charity</h3>
                <p className="text-gray-400 text-xs mb-4">
                  Choose what % of your subscription goes to this charity (min 10%)
                </p>
                <label className="text-gray-300 text-sm block mb-1">Contribution: {percentage}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="w-full accent-yellow-400 mb-4"
                />
                <button
                  onClick={selectCharity}
                  disabled={selecting}
                  className="w-full bg-yellow-400 text-gray-900 font-semibold py-2.5 rounded-xl text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60"
                >
                  {selecting ? "Selecting..." : "Select This Charity"}
                </button>
              </div>

              {/* Donate directly */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Heart size={15} className="text-red-400" /> Donate Directly
                </h3>
                <p className="text-gray-400 text-xs mb-3">One-time donation, not tied to subscription</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={donationAmount}
                      min="1"
                      onChange={(e) => setDonation(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:border-yellow-400 placeholder-gray-500"
                    />
                  </div>
                  <button
                    onClick={donate}
                    disabled={donating}
                    className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-sm hover:bg-red-500/20 transition-colors disabled:opacity-60"
                  >
                    {donating ? "..." : "Donate"}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
