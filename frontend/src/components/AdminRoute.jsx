import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== "admin")
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-xl font-semibold">⛔ Access Denied</p>
      </div>
    );

  return children;
};

export default AdminRoute;
