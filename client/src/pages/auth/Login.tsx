import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { authService } from "../../services/auth.service";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMsg(null);

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0] === "email") fieldErrors.email = issue.message;
        if (issue.path[0] === "password") fieldErrors.password = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMsg(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ color: "#10b981", fontSize: "36px", margin: "0 0 0.25rem" }}>TradeMind AI</h2>
          <span style={{ color: "#94a3b8", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Smart Analytics & Trading</span>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to access your dashboard and signals</p>

        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                id="email"
                type="email"
                className="form-input"
                style={{ paddingLeft: "2.5rem" }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <span className="form-error">
                <AlertCircle size={12} /> {errors.email}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>
                Password
              </label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: "12px" }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                id="password"
                type="password"
                className="form-input"
                style={{ paddingLeft: "2.5rem" }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <span className="form-error">
                <AlertCircle size={12} /> {errors.password}
              </span>
            )}
          </div>

          <button type="submit" className="form-button" disabled={isLoading}>
            {isLoading ? (
              <div style={{ width: "20px", height: "20px", border: "2px solid #000", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
          
          {import.meta.env.DEV && (
            <button 
              type="button" 
              onClick={() => {
                localStorage.setItem("bypass_auth", "true");
                window.location.reload();
              }}
              className="form-button"
              style={{ 
                marginTop: "0.75rem", 
                background: "rgba(16, 185, 129, 0.05)", 
                border: "1px dashed var(--accent-green)", 
                color: "var(--accent-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <span>Bypass Auth (Dev Mode)</span>
            </button>
          )}
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
