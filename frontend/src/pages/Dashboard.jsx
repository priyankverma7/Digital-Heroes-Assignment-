import { useEffect, useState } from "react";
import API from "../api/axios";
import UserDashboard from "./UserDashboard";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Session expired. Please log in again.</p>
      </div>
    );

  return user.role === "admin" ? (
    <AdminDashboard user={user} />
  ) : (
    <UserDashboard user={user} />
  );
};

export default Dashboard;
