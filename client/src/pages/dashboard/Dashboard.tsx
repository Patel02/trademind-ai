import React, { useEffect, useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";
import { authService } from "../../services/auth.service";
import { LogOut, User as UserIcon, Sparkles, TrendingUp, ShieldAlert, Award } from "lucide-react";

export const Dashboard: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [isSavingConsent, setIsSavingConsent] = useState(false);

  // Sync pending consents from localStorage once user is logged in
  useEffect(() => {
    if (user) {
      const key = `pending_consent_${user.id}`;
      const pending = localStorage.getItem(key);
      if (pending) {
        setIsSavingConsent(true);
        try {
          const { termsAccepted, riskAccepted } = JSON.parse(pending);
          authService
            .saveConsents(user.id, termsAccepted, riskAccepted)
            .then(() => {
              console.log("Saved pending consents successfully.");
              localStorage.removeItem(key);
            })
            .catch((err) => {
              console.error("Error saving pending consents:", err);
            })
            .finally(() => {
              setIsSavingConsent(false);
            });
        } catch (e) {
          console.error("Failed to parse local consents:", e);
          setIsSavingConsent(false);
        }
      }
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Failed to log out:", err);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "#10b981", color: "#000", borderRadius: "8px", width: "32px", height: "32px", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold" }}>M</div>
          <span style={{ fontSize: "18px", fontWeight: "700", letterSpacing: "-0.5px" }}>TradeMind AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ background: "#1e293b", padding: "6px", borderRadius: "50%", display: "flex" }}>
              <UserIcon size={16} color="#10b981" />
            </div>
            <span style={{ fontSize: "14px", color: "#f3f4f6" }}>
              {profile?.full_name || user?.email}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "1px solid #ef4444",
              color: "#ef4444",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "700", margin: "0 0 0.5rem", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
            Welcome to TradeMind AI <Sparkles size={24} color="#f59e0b" />
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "16px", margin: 0 }}>
            Your premium environment for intelligent trading insights, signals, and automated analysis is fully configured.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Profile Card */}
          <div style={{ background: "rgba(18, 22, 26, 0.85)", border: "1px solid var(--border-dark)", borderRadius: "12px", padding: "2rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", margin: "0 0 1.5rem", color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
              <UserIcon size={18} /> User Profile Account
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e242b", paddingBottom: "0.5rem" }}>
                <span style={{ color: "#9ca3af", fontSize: "14px" }}>Full Name</span>
                <span style={{ color: "#f3f4f6", fontSize: "14px", fontWeight: "500" }}>{profile?.full_name || "N/A"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e242b", paddingBottom: "0.5rem" }}>
                <span style={{ color: "#9ca3af", fontSize: "14px" }}>Email Address</span>
                <span style={{ color: "#f3f4f6", fontSize: "14px", fontWeight: "500" }}>{user?.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e242b", paddingBottom: "0.5rem" }}>
                <span style={{ color: "#9ca3af", fontSize: "14px" }}>Role</span>
                <span style={{ color: "#10b981", fontSize: "14px", fontWeight: "600", textTransform: "capitalize" }}>{profile?.role || "User"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af", fontSize: "14px" }}>Subscription Plan</span>
                <span style={{ color: "#f59e0b", fontSize: "14px", fontWeight: "600", textTransform: "capitalize", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Award size={14} /> {profile?.subscription_plan || "Free"}
                </span>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div style={{ background: "rgba(18, 22, 26, 0.85)", border: "1px solid var(--border-dark)", borderRadius: "12px", padding: "2rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", margin: "0 0 1.5rem", color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} /> Active Environment
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: "1.6", margin: "0 0 1rem" }}>
              Your account has successfully established connection with our PostgreSQL Database. All transaction operations and logs are encrypted under Row Level Security.
            </p>
            {isSavingConsent ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b", fontSize: "13px" }}>
                <div style={{ width: "14px", height: "14px", border: "2px solid #f59e0b", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span>Recording user consents...</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "13px" }}>
                <ShieldAlert size={16} />
                <span>Row Level Security (RLS) Enforced</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
