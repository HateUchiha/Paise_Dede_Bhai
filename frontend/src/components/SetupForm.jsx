import React, { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import { SpringButton } from "./ui/SpringButton";
import { Clock, DollarSign, IndianRupee, QrCode, Sparkles, User } from "lucide-react";

export const SetupForm = ({ onStart, isStarting }) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(1500);
  const [upiId, setUpiId] = useState("");
  const [intervalOption, setIntervalOption] = useState("60"); // minutes
  const [customMinutes, setCustomMinutes] = useState(15);
  const [error, setError] = useState("");

  const presets = [
    { label: "₹500", value: 500 },
    { label: "₹1,500", value: 1500 },
    { label: "₹3,000", value: 3000 },
    { label: "₹5,000", value: 5000 },
  ];

  const intervals = [
    { label: "30 min", value: "30" },
    { label: "1 hour", value: "60" },
    { label: "2 hours", value: "120" },
    { label: "4 hours", value: "240" },
    { label: "Custom", value: "custom" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your friend's WhatsApp contact name.");
      return;
    }
    if (Number(amount) <= 100) {
      setError("Amount must be greater than ₹100.");
      return;
    }

    const intervalMinutes =
      intervalOption === "custom" ? Number(customMinutes) : Number(intervalOption);

    if (intervalMinutes < 1) {
      setError("Reminder interval must be at least 1 minute.");
      return;
    }

    setError("");
    onStart({
      name: name.trim(),
      amount: Number(amount),
      upi_id: upiId.trim(),
      interval_minutes: intervalMinutes,
    });
  };

  return (
    <GlassCard className="max-w-xl mx-auto backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart WhatsApp Debt Recovery</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Set Up Debt Reminder
          </h2>
          <p className="text-sm text-zinc-400">
            Automate WhatsApp reminders until you get your money back.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}

        {/* 1. Contact Name */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            1. Friend's WhatsApp Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-medium"
            />
          </div>
          <p className="text-[11px] text-zinc-500 pl-1">
            Must match their contact name or saved chat name in WhatsApp Web.
          </p>
        </div>

        {/* 2. Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              2. Amount Owed (₹)
            </label>
            <span className="text-lg font-bold text-white font-mono">
              ₹{Number(amount).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-bold">
              ₹
            </div>
            <input
              type="number"
              min="101"
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-lg font-bold font-mono focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-2 pt-1">
            {presets.map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => setAmount(p.value)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all apple-press font-medium ${
                  amount === p.value
                    ? "bg-white text-zinc-950 border-white font-semibold shadow-sm"
                    : "bg-white/5 text-zinc-300 border-white/5 hover:bg-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. UPI ID (Optional) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              3. Your UPI ID (Optional)
            </label>
            <span className="text-[11px] text-zinc-500 font-medium">Auto-generates QR</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <QrCode className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@okhdfcbank"
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all font-mono"
            />
          </div>
          <p className="text-[11px] text-zinc-500 pl-1">
            If your friend asks for "QR bhejo" or "UPI", the bot will automatically send the payment QR!
          </p>
        </div>

        {/* 4. Reminder Frequency */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            4. Reminder Frequency
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {intervals.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setIntervalOption(item.value)}
                className={`py-2 px-2 rounded-2xl text-xs font-medium border text-center transition-all apple-press ${
                  intervalOption === item.value
                    ? "bg-white text-zinc-950 border-white font-semibold shadow-md scale-[1.02]"
                    : "bg-white/5 text-zinc-300 border-white/5 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {intervalOption === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="pt-2 flex items-center gap-3"
            >
              <input
                type="number"
                min="1"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(1, Number(e.target.value)))}
                className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono text-center focus:outline-none focus:border-white/30"
              />
              <span className="text-xs text-zinc-400">minutes between reminders</span>
            </motion.div>
          )}
        </div>

        {/* Submit CTA */}
        <div className="pt-3">
          <SpringButton
            type="submit"
            size="lg"
            variant="primary"
            disabled={isStarting}
            className="w-full shadow-[0_4px_30px_rgba(255,255,255,0.2)]"
          >
            {isStarting ? "Initializing Bot..." : "Launch WhatsApp Reminder Bot 🚀"}
          </SpringButton>
        </div>
      </form>
    </GlassCard>
  );
};
