import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>;

  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
