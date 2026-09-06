import React, { useState } from "react";
import { SessionCard } from "./SessionCard";
import { SpringButton } from "../ui/SpringButton";
import { Activity, Plus, RefreshCw } from "lucide-react";

export const SessionsGrid = ({
  sessions = [],
  onOpenDetail,
  onPause,
  onResume,
  onStop,
  onOpenQR,
  onRefresh,
  onNewReminder,
}) => {
  const [filter, setFilter] = useState("all");

  const filtered = sessions.filter((s) => {
    if (filter === "active") return s.status === "active";
    if (filter === "alerts") return s.status === "payment_detected" || s.status === "promise_detected";
    if (filter === "closed") return s.status === "closed";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Multi-Session Live Monitor
          </h2>
          <span className="text-xs text-zinc-400 font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            {sessions.length} total
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="glass-pill rounded-xl p-1 flex items-center gap-1">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active 🔴" },
              { id: "alerts", label: "Alerts ⚠️" },
              { id: "closed", label: "Closed" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`text-xs px-3 py-1 rounded-lg transition-all apple-press font-medium ${
                  filter === t.id
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
            title="Refresh Sessions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl mx-auto">
            📡
          </div>
          <h3 className="text-base font-bold text-white">No Live Reminder Sessions</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Select a contact from the Master Debt Table and launch an automated WhatsApp reminder bot.
          </p>
          <div className="pt-2">
            <SpringButton variant="primary" size="md" onClick={onNewReminder}>
              Launch First Session
            </SpringButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpenDetail={onOpenDetail}
              onPause={onPause}
              onResume={onResume}
              onStop={onStop}
              onOpenQR={onOpenQR}
            />
          ))}
        </div>
      )}
    </div>
  );
};
