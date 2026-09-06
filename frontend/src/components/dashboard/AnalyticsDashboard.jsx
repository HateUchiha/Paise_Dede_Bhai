import React from "react";
import { GlassCard } from "../ui/GlassCard";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  PieChart,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

export const AnalyticsDashboard = ({ metrics = {}, debts = [] }) => {
  const {
    total_debt_lent = 0,
    total_debt_recovered = 0,
    outstanding_balance = 0,
    active_sessions_count = 0,
    open_debts_count = 0,
    developer = "ZQG365 Application Services",
  } = metrics;

  const recoveryRate =
    total_debt_lent > 0
      ? Math.min(100, Math.round((total_debt_recovered / total_debt_lent) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Lent */}
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Total Debt Lent
            </span>
            <div className="text-2xl font-bold text-white font-mono mt-0.5">
              ₹{Number(total_debt_lent).toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-zinc-500">Across all contacts</span>
          </div>
        </GlassCard>

        {/* Total Recovered */}
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Total Recovered
            </span>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">
              ₹{Number(total_debt_recovered).toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-emerald-500/80 font-medium">
              {recoveryRate}% recovered
            </span>
          </div>
        </GlassCard>

        {/* Outstanding */}
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Outstanding Balance
            </span>
            <div className="text-2xl font-bold text-amber-300 font-mono mt-0.5">
              ₹{Number(outstanding_balance).toLocaleString("en-IN")}
            </div>
            <span className="text-[10px] text-zinc-500">
              {open_debts_count} active debtors
            </span>
          </div>
        </GlassCard>

        {/* Live Bot Sessions */}
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Active Bot Sessions
            </span>
            <div className="text-2xl font-bold text-white font-mono mt-0.5">
              {active_sessions_count}
            </div>
            <span className="text-[10px] text-zinc-500">Automated WhatsApp pings</span>
          </div>
        </GlassCard>
      </div>

      {/* Recovery Progress & Developer Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress bar card */}
        <GlassCard className="p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Capital Recovery Performance
              </h3>
              <p className="text-xs text-zinc-400">
                Tracking repayment velocity across all open and settled debts.
              </p>
            </div>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {recoveryRate}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 rounded-full bg-white/5 p-0.5 border border-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              style={{ width: `${recoveryRate}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
            <span>₹0 (Start)</span>
            <span>Recovered: ₹{Number(total_debt_recovered).toLocaleString("en-IN")}</span>
            <span>Target: ₹{Number(total_debt_lent).toLocaleString("en-IN")}</span>
          </div>
        </GlassCard>

        {/* Developer Attribution Card */}
        <GlassCard className="p-5 flex flex-col justify-between space-y-3 bg-gradient-to-br from-white/[0.03] to-indigo-500/[0.05] border-indigo-500/20">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold border border-indigo-500/20 mb-2">
              <ShieldCheck className="w-3 h-3" /> Enterprise Architecture
            </div>
            <h4 className="text-sm font-bold text-white">
              Developed by ZQG365 Application Services
            </h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Automated WhatsApp debt collection engine with Groq AI multilingual copy generation, intent analysis, and Apple-grade fluid interface.
            </p>
          </div>

          <div className="text-[11px] text-zinc-500 border-t border-white/5 pt-2 flex items-center justify-between">
            <span>Version 2.0 Pro</span>
            <span className="text-emerald-400 font-semibold">System Optimal</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
