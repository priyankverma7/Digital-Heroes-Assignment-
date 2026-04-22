import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { Trophy, Award, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Draw() {
  const [draw, setDraw]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [proofUrl, setProofUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    API.get("/draw/latest")
      .then((res) => setDraw(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Check if current user is a winner
  const myWinning = (() => {
    if (!draw || !user) return null;
    const tiers = ["match5", "match4", "match3"];
    for (const tier of tiers) {
      const w = draw.winners?.[tier]?.find(
        (w) => w.userId?._id === user._id || w.userId === user._id
      );
      if (w) return { ...w, tier };
    }
    return null;
  })();

  const uploadProof = async () => {
    if (!proofUrl) return toast.error("Enter a proof URL");
    setUploading(true);
    try {
      await API.post("/draw/proof", {
        drawId: draw._id,
        winnerId: myWinning._id,
        proofUrl,
      });
      toast.success("Proof submitted for review");
      setProofUrl("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const tierLabel = { match5: "5-Number Match 🏆", match4: "4-Number Match 🥈", match3: "3-Number Match 🥉" };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Loading draw...</p>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Trophy size={28} className="text-yellow-400" /> Monthly Draw
          </h1>

          {!draw ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
              <Trophy size={40} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No draw published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* My Win Banner */}
              {myWinning && (
                <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={20} className="text-yellow-400" />
                    <p className="text-yellow-300 font-bold text-lg">You won this draw!</p>
                  </div>
                  <p className="text-white text-2xl font-bold">₹{myWinning.prize?.toLocaleString()}</p>
                  <p className="text-yellow-400/70 text-sm mt-1">{tierLabel[myWinning.tier]}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-gray-400 capitalize">Verification: {myWinning.verificationStatus}</span>
                    <span className="text-xs text-gray-400 capitalize">Payment: {myWinning.paymentStatus}</span>
                  </div>

                  {/* Proof upload (PRD §09) */}
                  {myWinning.verificationStatus === "pending" && !myWinning.proofUrl && (
                    <div className="mt-4 flex gap-2">
                      <input
                        placeholder="Paste proof URL (screenshot link)"
                        value={proofUrl}
                        onChange={(e) => setProofUrl(e.target.value)}
                        className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-yellow-400 placeholder-gray-500"
                      />
                      <button
                        onClick={uploadProof}
                        disabled={uploading}
                        className="flex items-center gap-1.5 bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60"
                      >
                        <Upload size={14} />
                        {uploading ? "Submitting..." : "Submit Proof"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Draw Numbers */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-white font-semibold">{draw.month}</h2>
                  <span className="text-xs bg-green-400/10 text-green-400 px-3 py-1 rounded-full">Published</span>
                </div>

                <div className="flex gap-3 mb-6">
                  {draw.numbers?.map((n, i) => (
                    <span key={i} className="w-12 h-12 flex items-center justify-center bg-yellow-400 text-gray-900 rounded-full text-lg font-bold">
                      {n}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-800 rounded-xl p-4">
                    <p className="text-2xl font-bold text-white">₹{((draw.prizePool || 0) * 0.4).toLocaleString()}</p>
                    <p className="text-gray-400 text-xs mt-1">Match 5 (40%)</p>
                    <p className="text-yellow-400 text-xs">{draw.winners?.match5?.length || 0} winner{draw.winners?.match5?.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4">
                    <p className="text-2xl font-bold text-white">₹{((draw.prizePool || 0) * 0.35).toLocaleString()}</p>
                    <p className="text-gray-400 text-xs mt-1">Match 4 (35%)</p>
                    <p className="text-yellow-400 text-xs">{draw.winners?.match4?.length || 0} winner{draw.winners?.match4?.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4">
                    <p className="text-2xl font-bold text-white">₹{((draw.prizePool || 0) * 0.25).toLocaleString()}</p>
                    <p className="text-gray-400 text-xs mt-1">Match 3 (25%)</p>
                    <p className="text-yellow-400 text-xs">{draw.winners?.match3?.length || 0} winner{draw.winners?.match3?.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {draw.jackpotCarryForward > 0 && (
                  <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-xl text-center">
                    <p className="text-yellow-400 text-sm font-medium">
                      🎰 Jackpot carries forward: ₹{draw.jackpotCarryForward?.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Winners list */}
              {["match5", "match4", "match3"].map((tier) => {
                const tierWinners = draw.winners?.[tier] || [];
                if (tierWinners.length === 0) return null;
                return (
                  <div key={tier} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-3">{tierLabel[tier]}</h3>
                    <div className="space-y-2">
                      {tierWinners.map((w, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{w.userId?.name || "Anonymous"}</span>
                          <span className="text-yellow-400 font-medium">₹{w.prize?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </div>
      </div>
    </>
  );
}
