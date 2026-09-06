import React from "react";
import { motion } from "framer-motion";

export const SpringButton = ({
  children,
  onClick,
  variant = "primary", // primary, secondary, danger, glass, ghost
  size = "md", // sm, md, lg
  className = "",
  disabled = false,
  type = "button",
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium select-none cursor-pointer rounded-2xl relative overflow-hidden transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-40 disabled:pointer-events-none";

  const sizeStyles = {
    sm: "text-xs px-3.5 py-1.5 gap-1.5 rounded-xl",
    md: "text-sm px-5 py-2.5 gap-2 rounded-2xl tracking-tight",
    lg: "text-base px-6 py-3.5 gap-2.5 rounded-2xl font-semibold tracking-tight",
  }[size];

  const variantStyles = {
    primary:
      "bg-white text-zinc-950 shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:bg-zinc-100 font-semibold",
    secondary:
      "bg-zinc-800/80 text-white border border-white/10 hover:bg-zinc-700/80 shadow-sm",
    danger:
      "bg-red-500/90 text-white border border-red-400/30 hover:bg-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.25)]",
    glass:
      "bg-white/10 text-white border border-white/15 backdrop-blur-lg hover:bg-white/15 shadow-sm",
    ghost:
      "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
  }[variant];

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      transition={{
        type: "spring",
        stiffness: 450,
        damping: 25,
      }}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {/* Apple specular top glow */}
      {variant === "primary" && (
        <div className="absolute inset-x-0 top-0 h-[1px] bg-white/40 pointer-events-none" />
      )}
      {Icon && <Icon className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />}
      {children}
    </motion.button>
  );
};
