import React from "react";
import { motion } from "framer-motion";

interface CardProps {
  title?: React.ReactNode;
  subtitle?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  extra,
  children,
  className = "",
  hoverEffect = false,
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as any } },
  };

  const interactiveProps = hoverEffect
    ? {
        whileHover: { y: -4, scale: 1.008, transition: { duration: 0.2 } },
        style: { cursor: "pointer" },
      }
    : {};

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      {...interactiveProps}
      className={`card ${hoverEffect ? "card-interactive" : ""} ${className}`}
    >
      {(title || extra || subtitle) && (
        <div className="card-header">
          <div className="card-title-group">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <span className="card-subtitle">{subtitle}</span>}
          </div>
          {extra && <div className="card-extra">{extra}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </motion.div>
  );
};

export default Card;
