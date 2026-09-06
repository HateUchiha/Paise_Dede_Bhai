import React from "react";
import { GlassCard } from "../ui/GlassCard";
import { SpringButton } from "../ui/SpringButton";
import {
  MessageSquare,
  Pause,
  Play,
  QrCode,
  StopCircle,
} from "lucide-react";
import { CountdownRing } from "../ui/CountdownRing";

export const SessionCard = ({
  session,
  onOpenDetail,
  onPause,
  onResume,
  onStop,
  onOpenQR,
}) => {
  const isPaused = session.status === "paused";
  const isPaymentDetected = session.status === "payment_detected";
  const isPromiseDetected = session.status === "promise_detected";
  const isClosed = session.status === "closed";

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <GlassCard className="p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all border-white/10 relative">
      {/* Top row */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 border border-white/20 flex items-center justify-center font-bold text-white text-sm shadow-md">
              {getInitials(session.whatsapp_name)}
            </div>
            <div>
              <h4 className="font-bold text-white text-base tracking-tight leading-tight">
                {session.whatsapp_name}
              </h4>
              <span className="text-[11px] text-zinc-400">
                {session.display_name || "Contact"} • {session.language} ({session.tone})
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isPaymentDetected
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse"
                : isPromiseDetected
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                : isPaused
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : isClosed
                ? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {!isPaused && !isClosed && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            )}
            <span>
              {isPaymentDetected
                ? "Payment Detected! 🎉"
                : isPromiseDetected
                ? "Promise Received 📅"
                : isPaused
                ? "Paused ⏸️"
                : isClosed
                ? "Closed ⚪"
                : "Active Ping 🔴"}
            </span>
          </span>
        </div>

        {/* Balance & stats */}
        <div className="mt-4 flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Balance</span>
              <div className="font-bold text-white font-mono text-sm">
                ₹{Number(session.balance || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Pings Sent</span>
              <div className="font-bold text-white font-mono text-sm">
                {session.reminders_sent} / {session.interval_minutes}m
              </div>
            </div>
          </div>
          {session.status === "active" && (
            <CountdownRing
              secondsRemaining={session.seconds_until_next_reminder || 0}
              totalSeconds={(session.interval_minutes || 15) * 60}
              size={64}
              strokeWidth={6}
            />
          )}
        </div>

        {/* Latest message snippet */}
        <div className="mt-3 text-xs text-zinc-300 line-clamp-2 italic bg-black/20 p-2.5 rounded-xl border border-white/5">
          "{session.last_message_text || "Starting reminder sequence..."}"
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {!isClosed && (
            isPaused ? (
              <button
                onClick={() => onResume(session.id)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-400 transition-colors"
                title="Resume Reminders"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onPause(session.id)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition-colors"
                title="Pause Reminders"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            )
          )}

          {session.qr_filename && (
            <button
              onClick={() => onOpenQR(session.qr_filename)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
              title="View UPI QR"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          )}

          {!isClosed && (
            <button
              onClick={() => onStop(session.id)}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
              title="Stop Session"
            >
              <StopCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <SpringButton
          variant="primary"
          size="sm"
          icon={MessageSquare}
          onClick={() => onOpenDetail(session)}
        >
          Live Stream
        </SpringButton>
      </div>
    </GlassCard>
  );
};
