import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "../app/providers/AuthProvider";
import Loader from "../components/ui/Loader";

interface RoleGuardProps {
  allowedRoles: ("SUPER_ADMIN" | "ADMIN" | "PREMIUM_USER" | "FREE_USER" | "trader")[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}>
        <Loader type="card" count={1} height="200px" />
      </div>
    );
  }

  // Resolve user role mapping
  const rawRole = profile?.role || "FREE_USER";
  const plan = profile?.subscription_plan || "free";
  
  // Normalize roles: if subscription plan is premium or role is trader, treat as PREMIUM_USER
  let resolvedRole = rawRole;
  if (rawRole === "trader" || plan === "premium") {
    resolvedRole = "PREMIUM_USER";
  }

  // Administrators can access all features
  const hasAccess = 
    resolvedRole === "SUPER_ADMIN" || 
    resolvedRole === "ADMIN" || 
    allowedRoles.includes(resolvedRole as any) ||
    allowedRoles.includes(rawRole as any);

  if (!hasAccess) {
    return (
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          padding: "4rem 2rem", 
          textAlign: "center" 
        }}
      >
        <div 
          style={{ 
            background: "rgba(239, 68, 68, 0.05)", 
            border: "1px solid rgba(239, 68, 68, 0.2)", 
            borderRadius: "16px", 
            padding: "2.5rem 2rem", 
            maxWidth: "460px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
          }}
        >
          <ShieldAlert size={48} color="var(--accent-red)" style={{ marginBottom: "1.2rem" }} />
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#fff", margin: "0 0 10px 0" }}>
            Access Restricted
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.5", margin: "0 0 1.8rem 0" }}>
            This workspace module requires elevated permission levels or a Premium subscription tier. Please contact support or upgrade your plan.
          </p>
          <Link 
            to="/dashboard" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              background: "rgba(255,255,255,0.05)", 
              border: "1px solid var(--border)", 
              borderRadius: "8px", 
              padding: "8px 16px", 
              color: "#fff", 
              textDecoration: "none", 
              fontSize: "13px", 
              fontWeight: "600",
              transition: "all var(--transition-speed)"
            }}
            className="hover-bright"
          >
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
