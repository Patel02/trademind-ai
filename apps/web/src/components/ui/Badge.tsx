import React from "react";

interface BadgeProps {
  sentiment?: "bullish" | "bearish" | "neutral";
  variant?: "primary" | "success" | "danger" | "warning" | "info";
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  sentiment,
  variant,
  children,
  className = "",
  style,
}) => {
  // Determine color coding based on sentiment or variant
  let badgeClass = "badge";
  let displayValue = children;

  if (sentiment) {
    badgeClass += ` badge-sentiment-${sentiment}`;
    if (!displayValue) {
      displayValue = sentiment.toUpperCase();
    }
  } else if (variant) {
    badgeClass += ` badge-variant-${variant}`;
  } else {
    badgeClass += " badge-variant-primary";
  }

  return (
    <span className={`${badgeClass} ${className}`} style={style}>
      {sentiment && <span className="badge-sentiment-dot"></span>}
      <span className="badge-text">{displayValue}</span>
    </span>
  );
};

export default Badge;
