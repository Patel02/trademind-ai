import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../app/providers/AuthProvider";

export const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0d0f12",
        color: "#fff",
        fontFamily: "system-ui, sans-serif"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid #1e293b",
          borderTop: "4px solid #10b981",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ marginTop: "1rem", color: "#94a3b8" }}>Securing your session...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
