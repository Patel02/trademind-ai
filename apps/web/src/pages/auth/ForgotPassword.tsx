import React, { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Mail, KeyRound, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { authService } from "../../services/auth.service";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMsg(null);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setErrors({ email: validation.error.issues[0].message });
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Password reset failed:", err);
      setErrorMsg(err.message || "Failed to send password reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <CheckCircle size={60} color="#10b981" style={{ margin: "0 auto 1.5rem" }} />
          <h1 className="auth-title">Reset Link Sent</h1>
          <p style={{ color: "#94a3b8", marginTop: "1rem", lineHeight: "1.6" }}>
            A secure password reset link has been dispatched to: <strong style={{ color: "#fff" }}>{email}</strong>.
          </p>
          <div className="alert alert-success" style={{ marginTop: "1.5rem" }}>
            Check your spam folder if you do not receive it within a few minutes.
          </div>
          <div className="auth-footer" style={{ marginTop: "2rem" }}>
            <Link to="/login" className="auth-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ color: "#10b981", fontSize: "36px", margin: "0 0 0.25rem" }}>TradeMind AI</h2>
          <span style={{ color: "#94a3b8", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Smart Analytics & Trading</span>
        </div>

        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Receive an email link to securely reset your credentials</p>

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

          <button type="submit" className="form-button" disabled={isLoading}>
            {isLoading ? (
              <div style={{ width: "20px", height: "20px", border: "2px solid #000", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : (
              <>
                <KeyRound size={18} />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: "1.5rem" }}>
          <Link to="/login" className="auth-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
