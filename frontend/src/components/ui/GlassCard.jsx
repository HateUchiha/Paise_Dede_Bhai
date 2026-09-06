import React from "react";
import { motion } from "framer-motion";

export const GlassCard = ({
  children,
  className = "",
  animate = true,
  onClick,
  ...props
}) => {
  const CardComponent = animate ? motion.div : "div";
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 12, scale: 0.98 },
        transition: {
          type: "spring",
          damping: 24,
          stiffness: 280,
        },
      }
    : {};

  return (
    <CardComponent
      className={`glass-panel rounded-3xl p-6 relative overflow-hidden ${className}`}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {/* Apple specular subtle top gradient edge */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
      {children}
    </CardComponent>
  );
};
