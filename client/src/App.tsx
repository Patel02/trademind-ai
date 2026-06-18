import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./app/providers/AuthProvider";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

// Page Imports
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import Markets from "./pages/markets/Markets";
import Signals from "./pages/signals/Signals";
import News from "./pages/news/News";
import Watchlist from "./pages/watchlist/Watchlist";
import PaperTrading from "./pages/paper-trading/PaperTrading";
import Profile from "./pages/profile/Profile";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Main Routes wrapped with security and layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/analysis" element={
                <div style={{ padding: "2rem" }}>
                  <h1 style={{ fontSize: "28px", marginBottom: "1rem" }}>AI Analysis</h1>
                  <p style={{ color: "var(--text-secondary)" }}>AI-powered stock analysis model metrics, valuation estimates, and sector heatmaps.</p>
                </div>
              } />
              <Route path="/signals" element={<Signals />} />
              <Route path="/news" element={<News />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/paper-trading" element={<PaperTrading />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
