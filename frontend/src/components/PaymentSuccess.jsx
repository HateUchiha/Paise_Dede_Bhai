import React, { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { GlassCard } from "./ui/GlassCard";
import { SpringButton } from "./ui/SpringButton";
import { CheckCircle2, History, RotateCcw, Sparkles } from "lucide-react";

export const PaymentSuccess = ({
  name = "Rahul",
  amount = 1500,
  remindersSent = 1,
  onReset,
  onGoHistory,
}) => {
  useEffect(() => {
    // Apple-grade celebratory confetti blast
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 1000,
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ["#10b981", "#3b82f6", "#f59e0b"],
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      colors: ["#ffffff", "#38bdf8", "#ec4899"],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  return (
    <div className="max-w-lg mx-auto py-6">
      <GlassCard className="text-center p-8 sm:p-10 space-y-6 border-emerald-500/30 shadow-[0_20px_60px_rgba(16,185,129,0.15)] relative overflow-hidden">
        {/* Glow orb in background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/15 blur-[80px] rounded-full pointer-events-none" />

        {/* Big check icon with spring pulse */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 260,
            delay: 0.1,
          }}
          className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" /> Mission Accomplished
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Paisa Mil Gaya! 🎉
          </h2>
          <p className="text-sm text-zinc-300">
            <strong className="text-white">{name}</strong> has confirmed payment.
          </p>
        </div>

        {/* Amount Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring", damping: 20 }}
          className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-1"
        >
          <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            Amount Recovered
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-mono">
            ₹{amount ? Number(amount).toLocaleString("en-IN") : "0"}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[11px] text-zinc-400">Total Reminders</span>
            <div className="text-lg font-bold text-white mt-0.5">{remindersSent} pings</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[11px] text-zinc-400">Status</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">Settled ✅</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <SpringButton
            variant="primary"
            size="lg"
            className="w-full"
            icon={RotateCcw}
            onClick={onReset}
          >
            Collect From Another Friend
          </SpringButton>

          <SpringButton
            variant="ghost"
            size="md"
            className="w-full"
            icon={History}
            onClick={onGoHistory}
          >
            View Debt Recovery History
          </SpringButton>
        </div>
      </GlassCard>
    </div>
  );
};
