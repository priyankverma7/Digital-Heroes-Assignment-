import { useEffect, useState } from "react";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import toast from "react-hot-toast";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

export default function Score() {
  const [scores, setScores]     = useState([]);
  const [numbers, setNumbers]   = useState("");
  const [date, setDate]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [editId, setEditId]     = useState(null);
  const [editNums, setEditNums] = useState("");

  const fetchScores = async () => {
    try {
      const res = await API.get("/scores");
      setScores(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error("Active subscription required to view scores");
      }
    }
  };

  useEffect(() => { fetchScores(); }, []);

  const validateNumbers = (str) => {
    const arr = str.split(",").map((n) => Number(n.trim()));
    if (arr.length !== 5) return { valid: false, msg: "Enter exactly 5 numbers" };
    if (arr.some((n) => isNaN(n) || n < 1 || n > 45)) return { valid: false, msg: "Each number must be between 1 and 45 (Stableford)" };
    return { valid: true, arr };
  };

  const addScore = async (e) => {
    e.preventDefault();
    if (!date) return toast.error("Please select a date");

    const { valid, msg, arr } = validateNumbers(numbers);
    if (!valid) return toast.error(msg);

    try {
      setLoading(true);
      await API.post("/scores/add", { numbers: arr, date });
      toast.success("Score added!");
      setNumbers("");
      setDate("");
      fetchScores();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error adding score");
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async (id) => {
    const { valid, msg, arr } = validateNumbers(editNums);
    if (!valid) return toast.error(msg);
    try {
      await API.put(`/scores/${id}`, { numbers: arr });
      toast.success("Score updated");
      setEditId(null);
      fetchScores();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const deleteScore = async (id) => {
    if (!confirm("Delete this score?")) return;
    try {
      await API.delete(`/scores/${id}`);
      toast.success("Score deleted");
      fetchScores();
    } catch {
      toast.error("Delete failed");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Score Dashboard</h1>

          {/* ADD SCORE */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Plus size={18} className="text-yellow-400" /> Add Score
            </h2>
            <p className="text-gray-500 text-xs mb-4">
              Enter 5 Stableford scores (1–45), comma-separated. One score per date. Rolling 5-score cap applies.
            </p>
            <form onSubmit={addScore} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. 12, 8, 25, 34, 19"
                value={numbers}
                onChange={(e) => setNumbers(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 placeholder-gray-500 transition-colors"
              />
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add Score"}
              </button>
            </form>
          </div>

          {/* SCORES LIST */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-4">
              Your Scores
              <span className="text-gray-500 text-xs font-normal ml-2">
                ({scores.length}/5 — oldest auto-removed)
              </span>
            </h2>

            {scores.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No scores yet. Add your first one!</p>
            ) : (
              <div className="space-y-3">
                {scores.map((s, idx) => (
                  <div key={s._id} className="border border-gray-800 rounded-xl p-4 hover:bg-gray-800/40 transition-colors">
                    {editId === s._id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          value={editNums}
                          onChange={(e) => setEditNums(e.target.value)}
                          placeholder="5 numbers, comma separated"
                          className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400"
                        />
                        <button onClick={() => saveEdit(s._id)} className="text-green-400 hover:text-green-300 p-1">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-300 p-1">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex gap-2 mb-1">
                            {s.numbers?.map((n, i) => (
                              <span key={i} className="w-9 h-9 flex items-center justify-center bg-gray-800 text-white rounded-lg text-sm font-semibold border border-gray-700">
                                {n}
                              </span>
                            ))}
                          </div>
                          <p className="text-gray-500 text-xs">{new Date(s.date).toDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditId(s._id); setEditNums(s.numbers.join(", ")); }}
                            className="text-gray-400 hover:text-yellow-400 transition-colors p-1"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => deleteScore(s._id)} className="text-gray-400 hover:text-red-400 transition-colors p-1">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
