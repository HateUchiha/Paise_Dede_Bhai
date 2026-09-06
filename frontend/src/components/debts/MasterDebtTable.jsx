import React, { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { SpringButton } from "../ui/SpringButton";
import {
  BookOpen,
  Bot,
  CheckCircle2,
  Filter,
  Plus,
  QrCode,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";

export const MasterDebtTable = ({
  debts = [],
  onOpenLedger,
  onAddEntry,
  onStartReminder,
  onNewDebt,
}) => {
  const [filter, setFilter] = useState("all"); // all, open, closed
  const [search, setSearch] = useState("");

  const filteredDebts = debts.filter((d) => {
    const matchesFilter =
      filter === "all" ? true : filter === "open" ? d.status !== "closed" : d.status === "closed";
    const matchesSearch =
      (d.whatsapp_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.notes || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contact, notes..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="glass-pill rounded-xl p-1 flex items-center gap-1">
            {[
              { id: "all", label: "All Debts" },
              { id: "open", label: "Open Only" },
              { id: "closed", label: "Settled" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`text-xs px-3 py-1 rounded-lg transition-all apple-press font-medium ${
                  filter === tab.id
                    ? "bg-white text-zinc-950 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <SpringButton variant="primary" size="sm" icon={Plus} onClick={onNewDebt}>
            Add Debt
          </SpringButton>
        </div>
      </div>

      {/* Table Card */}
      <GlassCard className="p-0 overflow-hidden border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3.5 px-5">Contact & Notes</th>
                <th className="py-3.5 px-4">Tone / Lang</th>
                <th className="py-3.5 px-4 text-right">Lent</th>
                <th className="py-3.5 px-4 text-right">Recovered</th>
                <th className="py-3.5 px-4 text-right">Outstanding Balance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No matching debt records found.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => {
                  const balance = debt.balance ?? (debt.total_amount - debt.amount_recovered);
                  const isClosed = debt.status === "closed";
                  const hasActiveSession = Boolean(debt.active_session_id);

                  return (
                    <tr
                      key={debt.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Contact */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                            {getInitials(debt.whatsapp_name)}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                              <span>{debt.whatsapp_name}</span>
                              {hasActiveSession && (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>Live Bot</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                              {debt.display_name && <span>{debt.display_name}</span>}
                              {debt.notes && (
                                <span className="text-zinc-500 italic truncate max-w-[160px]">
                                  • {debt.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tone & Lang */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-medium capitalize text-zinc-300">
                            {debt.tone === "angry" ? "🔥 Angry" : debt.tone === "serious" ? "😤 Serious" : "😊 Casual"}
                          </span>
                          <span className="text-[10px] text-zinc-500 capitalize">
                            {debt.language || "English"}
                          </span>
                        </div>
                      </td>

                      {/* Lent */}
                      <td className="py-4 px-4 text-right font-mono text-zinc-300">
                        ₹{Number(debt.total_amount).toLocaleString("en-IN")}
                      </td>

                      {/* Recovered */}
                      <td className="py-4 px-4 text-right font-mono text-emerald-400 font-medium">
                        ₹{Number(debt.amount_recovered).toLocaleString("en-IN")}
                      </td>

                      {/* Balance */}
                      <td className="py-4 px-4 text-right">
                        <span
                          className={`font-mono text-sm font-bold ${
                            isClosed ? "text-zinc-500 line-through" : "text-white"
                          }`}
                        >
                          ₹{Number(balance).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isClosed
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : debt.amount_recovered > 0
                              ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                          }`}
                        >
                          {isClosed ? "Settled ✅" : debt.amount_recovered > 0 ? "Partial" : "Open"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ledger Entries Button */}
                          <button
                            onClick={() => onOpenLedger(debt)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 flex items-center gap-1 text-[11px] font-medium apple-press"
                            title="View / Edit Ledger Entries"
                          >
                            <BookOpen className="w-3 h-3 text-indigo-400" />
                            <span>Ledger</span>
                          </button>

                          {/* Quick Add Entry */}
                          <button
                            onClick={() => onAddEntry(debt)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors border border-white/5 apple-press"
                            title="Add Lent / Payment Entry"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Launch Reminder Bot */}
                          {!isClosed && (
                            <button
                              onClick={() => onStartReminder(debt)}
                              className="px-2.5 py-1.5 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 transition-colors shadow-sm flex items-center gap-1 text-[11px] apple-press"
                              title="Generate AI Messages & Remind"
                            >
                              <Bot className="w-3 h-3" />
                              <span>Remind</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
