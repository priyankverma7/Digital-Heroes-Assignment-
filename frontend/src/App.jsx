import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login        from "./pages/Login";
import Signup       from "./pages/Signup";
import Dashboard    from "./pages/Dashboard";
import Score        from "./pages/Score";
import Subscription from "./pages/Subscription";
import Charities    from "./pages/Charities";
import CharityDetails from "./pages/CharityDetails";
import Draw         from "./pages/Draw";
import AdminDashboard from "./pages/AdminDashboard";

import PrivateRoute from "./components/PrivateRoute";
import AdminRoute   from "./components/AdminRoute";

// Auth-aware redirect for login/signup pages
const AuthRedirect = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public — redirect to dashboard if already logged in */}
      <Route path="/"       element={<AuthRedirect><Login /></AuthRedirect>} />
      <Route path="/login"  element={<AuthRedirect><Login /></AuthRedirect>} />
      <Route path="/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />

      {/* User protected */}
      <Route path="/dashboard"    element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/score"        element={<PrivateRoute><Score /></PrivateRoute>} />
      <Route path="/subscription" element={<PrivateRoute><Subscription /></PrivateRoute>} />
      <Route path="/charities"    element={<PrivateRoute><Charities /></PrivateRoute>} />
      <Route path="/charities/:id" element={<PrivateRoute><CharityDetails /></PrivateRoute>} />
      <Route path="/draw"         element={<PrivateRoute><Draw /></PrivateRoute>} />

      {/* Admin protected */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <p className="text-6xl font-bold text-gray-700 mb-4">404</p>
            <p className="text-gray-400">Page not found</p>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
