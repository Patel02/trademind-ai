import React from "react";

interface LoaderProps {
  type?: "line" | "card" | "circle";
  count?: number;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Loader: React.FC<LoaderProps> = ({
  type = "line",
  count = 1,
  height,
  className = "",
  style,
}) => {
  const items = Array.from({ length: count });

  const getStyle = () => {
    if (height) return { height };
    if (type === "circle") return { width: "48px", height: "48px" };
    if (type === "card") return { height: "120px" };
    return { height: "16px" };
  };

  return (
    <div className={`skeleton-container ${className}`} style={style}>
      {items.map((_, index) => (
        <div
          key={index}
          className={`skeleton skeleton-${type}`}
          style={getStyle()}
        >
          <div className="skeleton-shine"></div>
        </div>
      ))}
    </div>
  );
};

export default Loader;
