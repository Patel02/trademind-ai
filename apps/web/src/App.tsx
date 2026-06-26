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
import Analysis from "./pages/analysis/Analysis";
import Signals from "./pages/signals/Signals";
import Performance from "./pages/signals/Performance";
import AdminSignals from "./pages/signals/AdminSignals";
import News from "./pages/news/News";
import Watchlist from "./pages/watchlist/Watchlist";
import PaperTrading from "./pages/paper-trading/PaperTrading";
import Profile from "./pages/profile/Profile";
import PortfolioDoctorPage from "./pages/portfolio-doctor/PortfolioDoctor";
import AIAssistantPage from "./pages/assistant/AIAssistant";
import TradePage from "./app/trade/[symbol]/page";
import Portfolio from "./pages/portfolio/Portfolio";
import History from "./pages/history/History";

import RoleGuard from "./security/RoleGuard";

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
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/signals" element={<Signals />} />
              <Route path="/signals/performance" element={<Performance />} />
              <Route 
                path="/admin/signals" 
                element={
                  <RoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
                    <AdminSignals />
                  </RoleGuard>
                } 
              />
              <Route path="/news" element={<News />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/paper-trading" element={<PaperTrading />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/wins" element={<History />} />
              <Route path="/history/losses" element={<History />} />
              <Route path="/trade" element={<Navigate to="/trade/TCS" replace />} />
              <Route path="/trade/:symbol" element={<TradePage />} />
              <Route 
                path="/portfolio/doctor" 
                element={
                  <RoleGuard allowedRoles={["FREE_USER", "PREMIUM_USER", "ADMIN", "SUPER_ADMIN"]}>
                    <PortfolioDoctorPage />
                  </RoleGuard>
                } 
              />
              <Route 
                path="/assistant" 
                element={
                  <RoleGuard allowedRoles={["FREE_USER", "PREMIUM_USER", "ADMIN", "SUPER_ADMIN"]}>
                    <AIAssistantPage />
                  </RoleGuard>
                } 
              />
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
