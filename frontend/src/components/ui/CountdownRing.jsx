import React from "react";
import { motion } from "framer-motion";

export const CountdownRing = ({
  secondsRemaining,
  totalSeconds,
  size = 120,
  strokeWidth = 8,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, secondsRemaining / totalSeconds)) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated countdown track */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "linear" }}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute flex flex-col items-center justify-center select-none text-center">
        <span className="text-xl font-bold tracking-tight text-white font-mono">
          {formattedTime}
        </span>
        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
          Next Ping
        </span>
      </div>
    </div>
  );
};
