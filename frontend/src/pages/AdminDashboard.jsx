import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import {
  Users, Trophy, Heart, BarChart2, ShieldCheck,
  Trash2, Ban, CheckCircle, RefreshCw, Play, Send
} from "lucide-react";

const TAB = { USERS: "users", DRAWS: "draws", CHARITIES: "charities", WINNERS: "winners", ANALYTICS: "analytics" };

// ─── ANALYTICS TAB ───────────────────────────────────────────
const AnalyticsTab = ({ stats }) => {
  if (!stats) return <p className="text-gray-400">Loading...</p>;
  const cards = [
    { label: "Total Users",          value: stats.totalUsers },
    { label: "Active Subscribers",   value: stats.activeUsers },
    { label: "Blocked Users",        value: stats.blockedUsers },
    { label: "Total Draws",          value: stats.totalDraws },
    { label: "Published Draws",      value: stats.publishedDraws },
    { label: "Total Scores",         value: stats.totalScores },
    { label: "Total Charities",      value: stats.totalCharities },
    { label: "Prize Distributed",    value: `₹${stats.totalPrizeDistributed?.toLocaleString()}` },
    { label: "Charity Contributions",value: `₹${stats.totalCharityContributions?.toLocaleString()}` },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cards.map(({ label, value }) => (
        <div key={label} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <p className="text-2xl font-bold text-white">{value ?? "—"}</p>
          <p className="text-gray-400 text-sm mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── USERS TAB ───────────────────────────────────────────────
const UsersTab = ({ users, onRefresh }) => {
  const block = async (id) => {
    await API.put(`/admin/block/${id}`);
    toast.success("User blocked");
    onRefresh();
  };
  const unblock = async (id) => {
    await API.put(`/admin/unblock/${id}`);
    toast.success("User unblocked");
    onRefresh();
  };
  const del = async (id) => {
    if (!confirm("Delete user and all their scores?")) return;
    await API.delete(`/admin/delete/${id}`);
    toast.success("User deleted");
    onRefresh();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-gray-800 text-left">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Role</th>
            <th className="pb-3 pr-4">Subscription</th>
            <th className="pb-3 pr-4">Charity %</th>
            <th className="pb-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {users.map((u) => (
            <tr key={u._id} className="text-gray-300">
              <td className="py-3 pr-4 font-medium text-white">{u.name}</td>
              <td className="py-3 pr-4">{u.email}</td>
              <td className="py-3 pr-4">
                <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === "admin" ? "bg-purple-400/10 text-purple-400" : "bg-gray-700 text-gray-300"}`}>
                  {u.role}
                </span>
              </td>
              <td className="py-3 pr-4">
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  u.subscription?.status === "active" ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"
                }`}>
                  {u.subscription?.status || "inactive"}
                </span>
              </td>
              <td className="py-3 pr-4">{u.charity?.contributionPercent ?? "—"}%</td>
              <td className="py-3">
                <div className="flex gap-2">
                  {u.isBlocked ? (
                    <button onClick={() => unblock(u._id)} className="flex items-center gap-1 bg-green-500/10 text-green-400 hover:bg-green-500/20 px-2 py-1 rounded-lg text-xs transition-colors">
                      <CheckCircle size={12} /> Unblock
                    </button>
                  ) : (
                    <button onClick={() => block(u._id)} className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 px-2 py-1 rounded-lg text-xs transition-colors">
                      <Ban size={12} /> Block
                    </button>
                  )}
                  <button onClick={() => del(u._id)} className="flex items-center gap-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2 py-1 rounded-lg text-xs transition-colors">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── DRAWS TAB ───────────────────────────────────────────────
const DrawsTab = ({ draws, onRefresh }) => {
  const [drawType, setDrawType] = useState("random");
  const [simResult, setSimResult] = useState(null);
  const [creating, setCreating] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const simulate = async () => {
    setSimulating(true);
    try {
      const res = await API.post("/draw/simulate", { drawType });
      setSimResult(res.data);
      toast.success("Simulation complete");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  const create = async () => {
    if (!confirm(`Create a ${drawType} draw?`)) return;
    setCreating(true);
    try {
      await API.post("/draw/create", { drawType });
      toast.success("Draw created as draft");
      onRefresh();
      setSimResult(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create draw");
    } finally {
      setCreating(false);
    }
  };

  const publish = async (id) => {
    try {
      await API.put(`/draw/${id}/publish`);
      toast.success("Draw published!");
      onRefresh();
    } catch (err) {
      toast.error("Failed to publish");
    }
  };

  return (
    <div className="space-y-6">
      {/* Draw Controls */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h4 className="text-white font-medium mb-4">Create / Simulate Draw</h4>
        <div className="flex gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="random" checked={drawType === "random"} onChange={() => setDrawType("random")} className="accent-yellow-400" />
            <span className="text-gray-300 text-sm">Random</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="algorithmic" checked={drawType === "algorithmic"} onChange={() => setDrawType("algorithmic")} className="accent-yellow-400" />
            <span className="text-gray-300 text-sm">Algorithmic (weighted)</span>
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={simulate} disabled={simulating} className="flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl text-sm hover:bg-blue-500/20 transition-colors disabled:opacity-60">
            <Play size={14} /> {simulating ? "Simulating..." : "Simulate"}
          </button>
          <button onClick={create} disabled={creating} className="flex items-center gap-2 bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60">
            <RefreshCw size={14} /> {creating ? "Creating..." : "Create Draw"}
          </button>
        </div>

        {simResult && (
          <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-300 text-sm font-medium mb-2">Simulation Preview</p>
            <div className="flex gap-2 mb-3">
              {simResult.numbers?.map((n, i) => (
                <span key={i} className="w-9 h-9 flex items-center justify-center bg-yellow-400 text-gray-900 rounded-full text-sm font-bold">{n}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center"><p className="text-white font-bold">{simResult.winners?.match5Count}</p><p className="text-gray-400">Match 5</p></div>
              <div className="text-center"><p className="text-white font-bold">{simResult.winners?.match4Count}</p><p className="text-gray-400">Match 4</p></div>
              <div className="text-center"><p className="text-white font-bold">{simResult.winners?.match3Count}</p><p className="text-gray-400">Match 3</p></div>
            </div>
            <p className="text-gray-400 text-xs mt-2">Prize pool: ₹{simResult.prizePool?.toLocaleString()} · Carry forward: ₹{simResult.newCarryForward?.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Draws List */}
      <div className="space-y-3">
        {draws.length === 0 ? (
          <p className="text-gray-400 text-sm">No draws yet</p>
        ) : draws.map((d) => (
          <div key={d._id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-white font-medium">{d.month}</p>
              <div className="flex gap-1.5 mt-1">
                {d.numbers?.map((n, i) => (
                  <span key={i} className="w-7 h-7 flex items-center justify-center bg-gray-700 text-white rounded-full text-xs font-bold">{n}</span>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Pool: ₹{d.prizePool?.toLocaleString()} · Carry: ₹{d.jackpotCarryForward?.toLocaleString()} · Type: {d.drawType}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                d.status === "published" ? "bg-green-400/10 text-green-400" : "bg-gray-700 text-gray-300"
              }`}>
                {d.status}
              </span>
              {d.status !== "published" && (
                <button onClick={() => publish(d._id)} className="flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-xl text-xs hover:bg-green-500/20 transition-colors">
                  <Send size={12} /> Publish
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── WINNERS TAB ─────────────────────────────────────────────
const WinnersTab = ({ winners, onRefresh }) => {
  const verify = async (drawId, winnerId, action) => {
    try {
      await API.post("/draw/verify", { drawId, winnerId, action });
      toast.success(`Winner ${action}d`);
      onRefresh();
    } catch {
      toast.error("Action failed");
    }
  };

  const payout = async (drawId, winnerId) => {
    try {
      await API.post("/draw/payout", { drawId, winnerId });
      toast.success("Payout marked complete");
      onRefresh();
    } catch {
      toast.error("Payout failed");
    }
  };

  return (
    <div className="space-y-3">
      {winners.length === 0 ? (
        <p className="text-gray-400 text-sm">No winners yet</p>
      ) : winners.map((w, i) => (
        <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-medium">{w.userId?.name || "Unknown"}</p>
              <p className="text-gray-400 text-sm">{w.userId?.email}</p>
              <p className="text-gray-400 text-xs mt-1">{w.month} · {w.tier} · ₹{w.prize?.toLocaleString()}</p>
              {w.proofUrl && (
                <a href={w.proofUrl} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline">View Proof</a>
              )}
            </div>
            <div className="flex flex-col gap-2 items-end">
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                w.verificationStatus === "approved" ? "bg-green-400/10 text-green-400"
                : w.verificationStatus === "rejected" ? "bg-red-400/10 text-red-400"
                : "bg-yellow-400/10 text-yellow-400"
              }`}>
                {w.verificationStatus}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                w.paymentStatus === "paid" ? "bg-green-400/10 text-green-400" : "bg-gray-700 text-gray-400"
              }`}>
                {w.paymentStatus}
              </span>
            </div>
          </div>

          {w.verificationStatus === "pending" && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => verify(w.drawId, w._id, "approve")} className="bg-green-500/10 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs hover:bg-green-500/20 transition-colors">
                Approve
              </button>
              <button onClick={() => verify(w.drawId, w._id, "reject")} className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
                Reject
              </button>
            </div>
          )}

          {w.verificationStatus === "approved" && w.paymentStatus === "pending" && (
            <button onClick={() => payout(w.drawId, w._id)} className="mt-3 bg-yellow-400 text-gray-900 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-yellow-300 transition-colors">
              Mark Paid
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── CHARITIES TAB ───────────────────────────────────────────
const CharitiesTab = ({ charities, onRefresh }) => {
  const [form, setForm] = useState({ name: "", description: "", category: "other", isFeatured: false });
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!form.name || !form.description) return toast.error("Name and description required");
    setCreating(true);
    try {
      await API.post("/charities", form);
      toast.success("Charity created");
      setForm({ name: "", description: "", category: "other", isFeatured: false });
      onRefresh();
    } catch {
      toast.error("Failed to create charity");
    } finally {
      setCreating(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this charity?")) return;
    await API.delete(`/charities/${id}`);
    toast.success("Deleted");
    onRefresh();
  };

  const toggleFeatured = async (id, current) => {
    await API.put(`/charities/${id}`, { isFeatured: !current });
    toast.success("Updated");
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h4 className="text-white font-medium mb-4">Add Charity</h4>
        <div className="space-y-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400 placeholder-gray-500" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400 placeholder-gray-500 resize-none" />
          <div className="flex gap-3">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-400">
              {["health","education","environment","animals","other"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-gray-300 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="accent-yellow-400" />
              Featured
            </label>
          </div>
          <button onClick={create} disabled={creating} className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-yellow-300 transition-colors disabled:opacity-60">
            {creating ? "Creating..." : "Create Charity"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {charities.map((c) => (
          <div key={c._id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-white font-medium">{c.name}</p>
              <p className="text-gray-400 text-sm">{c.category} · ₹{c.donationReceived?.toLocaleString()} donated</p>
              {c.isFeatured && <span className="text-xs bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded-full">Featured</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleFeatured(c._id, c.isFeatured)} className="bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-600 transition-colors">
                {c.isFeatured ? "Unfeature" : "Feature"}
              </button>
              <button onClick={() => del(c._id)} className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN ADMIN DASHBOARD ────────────────────────────────────
const AdminDashboard = () => {
  const [tab, setTab]           = useState(TAB.ANALYTICS);
  const [users, setUsers]       = useState([]);
  const [draws, setDraws]       = useState([]);
  const [winners, setWinners]   = useState([]);
  const [charities, setCharities] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const load = async () => {
    try {
      const [u, d, w, c, a] = await Promise.all([
        API.get("/admin/users"),
        API.get("/admin/draws"),
        API.get("/admin/winners"),
        API.get("/charities"),
        API.get("/admin/analytics"),
      ]);
      setUsers(u.data);
      setDraws(d.data);
      setWinners(w.data);
      setCharities(c.data);
      setAnalytics(a.data);
    } catch (err) {
      console.error("Admin load error:", err);
    }
  };

  useEffect(() => { load(); }, []);

  const tabs = [
    { key: TAB.ANALYTICS, label: "Analytics",  Icon: BarChart2 },
    { key: TAB.USERS,     label: "Users",       Icon: Users },
    { key: TAB.DRAWS,     label: "Draws",       Icon: Trophy },
    { key: TAB.WINNERS,   label: "Winners",     Icon: ShieldCheck },
    { key: TAB.CHARITIES, label: "Charities",   Icon: Heart },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Admin Panel</h1>

          {/* Tab Nav */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {tabs.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === key
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            {tab === TAB.ANALYTICS  && <AnalyticsTab stats={analytics} />}
            {tab === TAB.USERS      && <UsersTab users={users} onRefresh={load} />}
            {tab === TAB.DRAWS      && <DrawsTab draws={draws} onRefresh={load} />}
            {tab === TAB.WINNERS    && <WinnersTab winners={winners} onRefresh={load} />}
            {tab === TAB.CHARITIES  && <CharitiesTab charities={charities} onRefresh={load} />}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
