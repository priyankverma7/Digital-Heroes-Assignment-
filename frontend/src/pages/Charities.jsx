import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import Navbar from "../components/Navbar";
import { Search, Star } from "lucide-react";

export default function Charities() {
  const [charities, setCharities] = useState([]);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("");
  const [loading, setLoading]     = useState(true);

  const fetchCharities = async () => {
    try {
      const res = await API.get(`/charities?search=${search}&category=${category}`);
      setCharities(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCharities(); }, [search, category]);

  const categories = ["", "health", "education", "environment", "animals", "other"];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Charities</h1>
          <p className="text-gray-400 mb-8">Select a charity — a portion of your subscription goes directly to them</p>

          {/* Search + Filter */}
          <div className="flex gap-3 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-4 top-3.5 text-gray-500" />
              <input
                placeholder="Search charities..."
                className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-yellow-400 placeholder-gray-500 transition-colors"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-400 transition-colors"
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : "All Categories"}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : charities.length === 0 ? (
            <p className="text-gray-400 text-center py-16">No charities found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {charities.map((c) => (
                <Link
                  key={c._id}
                  to={`/charities/${c._id}`}
                  className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-yellow-400/50 transition-all"
                >
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="h-44 w-full bg-gray-800 flex items-center justify-center">
                      <span className="text-4xl">❤️</span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-white font-semibold text-lg leading-tight">{c.name}</h2>
                      {c.isFeatured && (
                        <Star size={16} className="text-yellow-400 shrink-0 ml-2 mt-0.5" fill="currentColor" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2">{c.description}</p>

                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg capitalize">{c.category}</span>
                      {c.donationReceived > 0 && (
                        <span className="text-xs text-green-400">₹{c.donationReceived?.toLocaleString()} raised</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
