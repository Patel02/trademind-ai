import React, { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { User, Mail, Lock, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { authService } from "../../services/auth.service";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  riskAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the risk disclosure",
  }),
});

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [riskAccepted, setRiskAccepted] = useState(false);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMsg(null);

    const validation = registerSchema.safeParse({
      fullName,
      email,
      password,
      termsAccepted,
      riskAccepted,
    });

    if (!validation.success) {
      const fieldErrors: { [key: string]: string } = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.register(email, password, fullName);
      
      // Store consents temporarily in localStorage. 
      // If auto-login is active, we write them immediately; otherwise they are written on first login.
      const userId = data.user?.id;
      if (userId) {
        localStorage.setItem(`pending_consent_${userId}`, JSON.stringify({
          termsAccepted,
          riskAccepted,
        }));
        
        // If user session exists immediately, write to database
        if (data.session) {
          try {
            await authService.saveConsents(userId, termsAccepted, riskAccepted);
            localStorage.removeItem(`pending_consent_${userId}`);
          } catch (consentErr) {
            console.error("Failed to save consents immediately:", consentErr);
          }
        }
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error("Registration failed:", err);
      setErrorMsg(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <CheckCircle size={60} color="#10b981" style={{ margin: "0 auto 1.5rem" }} />
          <h1 className="auth-title">Registration Successful</h1>
          <p style={{ color: "#94a3b8", marginTop: "1rem", lineHeight: "1.6" }}>
            A verification link has been sent to your email address: <strong style={{ color: "#fff" }}>{email}</strong>.
          </p>
          <div className="alert alert-success" style={{ marginTop: "1.5rem" }}>
            Please check your inbox and verify your email to log in to TradeMind AI.
          </div>
          <div className="auth-footer" style={{ marginTop: "2rem" }}>
            <Link to="/login" className="auth-link" style={{ fontSize: "15px", fontWeight: "600" }}>
              Go to Sign In
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

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Register to start monitoring trading signals</p>

        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">
              Full Name
            </label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                id="fullName"
                type="text"
                className="form-input"
                style={{ paddingLeft: "2.5rem" }}
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {errors.fullName && (
              <span className="form-error">
                <AlertCircle size={12} /> {errors.fullName}
              </span>
            )}
          </div>

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
                placeholder="john@example.com"
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

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                id="password"
                type="password"
                className="form-input"
                style={{ paddingLeft: "2.5rem" }}
                placeholder="At least 12 characters"
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
            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", lineHeight: "1.4" }}>
              Must contain 12+ characters, an uppercase letter, a lowercase letter, a digit, and a special character.
            </span>
          </div>

          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={isLoading}
            />
            <span>
              I accept the <a href="#terms" className="auth-link">Terms and Conditions</a>
            </span>
          </label>
          {errors.termsAccepted && (
            <div className="form-error" style={{ marginBottom: "0.5rem" }}>
              <AlertCircle size={12} /> {errors.termsAccepted}
            </div>
          )}

          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={riskAccepted}
              onChange={(e) => setRiskAccepted(e.target.checked)}
              disabled={isLoading}
            />
            <span>
              I acknowledge the <a href="#risk" className="auth-link">Risk Disclosure Statement</a> (Trading carries high risk)
            </span>
          </label>
          {errors.riskAccepted && (
            <div className="form-error" style={{ marginBottom: "0.5rem" }}>
              <AlertCircle size={12} /> {errors.riskAccepted}
            </div>
          )}

          <button type="submit" className="form-button" disabled={isLoading}>
            {isLoading ? (
              <div style={{ width: "20px", height: "20px", border: "2px solid #000", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
