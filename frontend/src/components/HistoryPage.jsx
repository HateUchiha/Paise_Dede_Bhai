import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import { SpringButton } from "./ui/SpringButton";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  RotateCcw,
  Trash2,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

export const HistoryPage = ({ onNewReminder }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    if (window.confirm("Clear all debt reminder history?")) {
      try {
        await fetch("/api/history", { method: "DELETE" });
        setHistory([]);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const totalRecovered = history
    .filter((h) => h.status === "settled")
    .reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

  const totalFriends = history.length;
  const settledCount = history.filter((h) => h.status === "settled").length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Recovery History
          </h2>
          <p className="text-sm text-zinc-400">
            Log of past debt reminders and settled amounts.
          </p>
        </div>
        <div className="flex gap-2">
          {history.length > 0 && (
            <SpringButton
              variant="secondary"
              size="sm"
              icon={Trash2}
              onClick={handleClearHistory}
            >
              Clear All
            </SpringButton>
          )}
          <SpringButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={onNewReminder}
          >
            New Reminder
          </SpringButton>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              Total Recovered
            </span>
            <div className="text-xl font-bold text-white font-mono">
              ₹{totalRecovered.toLocaleString("en-IN")}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              Friends Chased
            </span>
            <div className="text-xl font-bold text-white">
              {totalFriends}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              Success Rate
            </span>
            <div className="text-xl font-bold text-white">
              {totalFriends > 0 ? `${Math.round((settledCount / totalFriends) * 100)}%` : "0%"}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Debt Cards List */}
      {loading ? (
        <div className="py-12 text-center text-zinc-500 text-sm">
          Loading recovery logs...
        </div>
      ) : history.length === 0 ? (
        <GlassCard className="p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-xl">
            📜
          </div>
          <h3 className="text-base font-semibold text-white">No Debt Records Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Once you start a reminder and recover your money, your records and stats will appear here.
          </p>
          <div className="pt-2">
            <SpringButton variant="primary" size="md" onClick={onNewReminder}>
              Start Your First Reminder
            </SpringButton>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {history.map((item, idx) => {
              const isSettled = item.status === "settled";
              return (
                <motion.div
                  key={item.session_id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold border ${
                          isSettled
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                        }`}
                      >
                        {item.name ? item.name.slice(0, 2).toUpperCase() : "??"}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white text-base">
                            {item.name}
                          </h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              isSettled
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                            }`}
                          >
                            {isSettled ? "Settled ✅" : "Stopped ⛔"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                          <span>{item.date || "Recent"}</span>
                          <span>•</span>
                          <span>{item.reminders_sent || 0} reminders</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-bold text-white font-mono">
                        ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                      </span>
                      {item.upi_id && (
                        <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px]">
                          {item.upi_id}
                        </p>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
