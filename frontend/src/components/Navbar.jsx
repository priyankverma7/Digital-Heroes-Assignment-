import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Trophy, Heart, LayoutDashboard, Star, LogOut, Shield } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navLink = (to, label, Icon) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive(to)
          ? "bg-white/20 text-white"
          : "text-white/70 hover:text-white hover:bg-white/10"
      }`}
    >
      <Icon size={15} />
      {label}
    </Link>
  );

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Trophy size={22} className="text-yellow-400" />
          <span className="text-white font-bold text-lg tracking-tight">Digital Heroes</span>
        </Link>

        <div className="flex items-center gap-1">
          {navLink("/dashboard", "Dashboard", LayoutDashboard)}
          {navLink("/score", "Scores", Star)}
          {navLink("/charities", "Charities", Heart)}
          {navLink("/draw", "Draw", Trophy)}
          {navLink("/subscription", "Subscription", Star)}
          {user?.role === "admin" && navLink("/admin", "Admin", Shield)}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </nav>
  );
}
