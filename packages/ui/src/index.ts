import React from "react";

/**
 * 1. Button Component
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "8px",
      fontWeight: "600",
      fontFamily: "Inter, sans-serif",
      transition: "all 0.2s ease-in-out",
      cursor: "pointer",
      border: "none",
      outline: "none"
    };

    const variantStyles = {
      primary: {
        background: "var(--accent-blue, #3b82f6)",
        color: "#ffffff"
      },
      secondary: {
        background: "var(--bg-secondary, #1e293b)",
        color: "var(--text-primary, #ffffff)",
        border: "1px solid var(--border-color, #334155)"
      },
      danger: {
        background: "var(--accent-red, #ef4444)",
        color: "#ffffff"
      },
      success: {
        background: "var(--accent-green, #10b981)",
        color: "#ffffff"
      },
      ghost: {
        background: "transparent",
        color: "var(--text-secondary, #94a3b8)"
      }
    };

    const sizeStyles = {
      sm: { padding: "6px 12px", fontSize: "12px" },
      md: { padding: "10px 18px", fontSize: "14px" },
      lg: { padding: "14px 24px", fontSize: "16px" }
    };

    const mergedStyles = {
      ...baseStyle,
      ...variantStyles[variant],
      ...sizeStyles[size]
    };

    return (
      <button
        ref={ref}
        style={mergedStyles}
        className={`tmai-button ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

/**
 * 2. Card Component
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ className = "", hoverable = false, children, ...props }) => {
  const cardStyle = {
    background: "var(--bg-card, #1e293b)",
    border: "1px solid var(--border-color, #334155)",
    borderRadius: "12px",
    padding: "20px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    cursor: hoverable ? "pointer" : "default"
  };

  return (
    <div
      style={cardStyle}
      className={`tmai-card ${hoverable ? "tmai-card-hover" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * 3. Input Component
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, ...props }, ref) => {
    const labelStyle = {
      display: "block",
      fontSize: "12px",
      fontWeight: "600",
      color: "var(--text-secondary, #94a3b8)",
      marginBottom: "6px"
    };

    const inputStyle = {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "8px",
      background: "var(--bg-input, #0f172a)",
      border: error ? "1.5px solid var(--accent-red, #ef4444)" : "1px solid var(--border-color, #334155)",
      color: "var(--text-primary, #ffffff)",
      fontSize: "14px",
      outline: "none",
      transition: "border-color 0.2s ease"
    };

    const errorStyle = {
      fontSize: "12px",
      color: "var(--accent-red, #ef4444)",
      marginTop: "4px"
    };

    return (
      <div style={{ marginBottom: "16px" }}>
        {label && <label style={labelStyle}>{label}</label>}
        <input
          ref={ref}
          style={inputStyle}
          className={`tmai-input ${className}`}
          {...props}
        />
        {error && <span style={errorStyle}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

/**
 * 4. Badge Component
 */
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}

export const Badge: React.FC<BadgeProps> = ({ className = "", variant = "neutral", children, ...props }) => {
  const badgeColors = {
    success: { bg: "rgba(16, 185, 129, 0.15)", text: "var(--accent-green, #10b981)" },
    warning: { bg: "rgba(245, 158, 11, 0.15)", text: "var(--accent-yellow, #f59e0b)" },
    danger: { bg: "rgba(239, 68, 68, 0.15)", text: "var(--accent-red, #ef4444)" },
    info: { bg: "rgba(59, 130, 246, 0.15)", text: "var(--accent-blue, #3b82f6)" },
    neutral: { bg: "rgba(148, 163, 184, 0.15)", text: "var(--text-secondary, #94a3b8)" }
  };

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: badgeColors[variant].bg,
    color: badgeColors[variant].text,
    whiteSpace: "nowrap" as const
  };

  return (
    <span style={badgeStyle} className={`tmai-badge ${className}`} {...props}>
      {children}
    </span>
  );
};

/**
 * 5. Loader Component
 */
export const Loader: React.FC = () => {
  const loaderStyle = {
    width: "28px",
    height: "28px",
    border: "3px solid rgba(255, 255, 255, 0.1)",
    borderTop: "3px solid var(--accent-blue, #3b82f6)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
      <div style={loaderStyle} className="tmai-spinner"></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * 6. Table Component
 */
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[];
}

export const Table: React.FC<TableProps> = ({ className = "", headers, children, ...props }) => {
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    textAlign: "left" as const,
    fontSize: "14px"
  };

  const thStyle = {
    padding: "12px 16px",
    borderBottom: "1px solid var(--border-color, #334155)",
    color: "var(--text-secondary, #94a3b8)",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    fontSize: "11px",
    letterSpacing: "0.05em"
  };

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <table style={tableStyle} className={`tmai-table ${className}`} {...props}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

/**
 * 7. Dialog Component
 */
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const overlayStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px"
  };

  const containerStyle = {
    background: "var(--bg-card, #1e293b)",
    border: "1px solid var(--border-color, #334155)",
    borderRadius: "16px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    animation: "fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid var(--border-color, #334155)"
  };

  const bodyStyle = {
    padding: "24px"
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={containerStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text-primary, #ffffff)" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary, #94a3b8)",
              cursor: "pointer",
              fontSize: "20px"
            }}
          >
            &times;
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  );
};
