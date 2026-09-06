import React, { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";
import { SpringButton } from "./ui/SpringButton";
import { CountdownRing } from "./ui/CountdownRing";
import { ActivityFeed } from "./ui/ActivityFeed";
import { BottomSheet } from "./ui/BottomSheet";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  QrCode,
  Send,
  StopCircle,
  User,
} from "lucide-react";

export const BotDashboard = ({
  statusData,
  onStopBot,
  onSimulateReply,
  onOpenQR,
}) => {
  const {
    name,
    amount,
    upi_id,
    interval_minutes,
    reminders_sent = 0,
    messages = [],
    qr_filename,
    seconds_until_next_reminder = 0,
    is_running = true,
  } = statusData || {};

  const [customReply, setCustomReply] = useState("");
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const quickReplies = [
    { label: "✅ 'Bhej diya'", text: "bhej diya hai bhai check karle" },
    { label: "📲 'Send QR'", text: "send qr code please" },
    { label: "😅 'Kal pakka'", text: "bhai kal pakka de dunga promise" },
    { label: "💸 'Paid ₹" + amount + "'", text: `I paid ₹${amount} right now` },
  ];

  const handleSendSimulatedReply = (text) => {
    if (!text.trim()) return;
    onSimulateReply(text);
    setCustomReply("");
  };

  const getInitials = (str = "") => {
    return str
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner & Status */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Contact summary */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg border border-white/20">
              {getInitials(name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{name}</h2>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Bot Active</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                <span>Amount: <strong className="text-white font-mono">₹{amount?.toLocaleString("en-IN")}</strong></span>
                <span>•</span>
                <span>Interval: <strong className="text-white">{interval_minutes}m</strong></span>
                <span>•</span>
                <span>Pings: <strong className="text-white">{reminders_sent}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {qr_filename && (
              <SpringButton
                variant="secondary"
                size="sm"
                icon={QrCode}
                onClick={() => onOpenQR(qr_filename)}
              >
                View QR
              </SpringButton>
            )}
            <SpringButton
              variant="danger"
              size="sm"
              icon={StopCircle}
              onClick={() => setShowStopConfirm(true)}
            >
              Stop Bot
            </SpringButton>
          </div>
        </div>
      </GlassCard>

      {/* Main Grid: Countdown & Activity Stream */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Metrics & Countdown */}
        <div className="space-y-6 md:col-span-1">
          {/* Countdown card */}
          <GlassCard className="flex flex-col items-center justify-center p-6 text-center">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Next WhatsApp Ping
            </h3>
            <CountdownRing
              secondsRemaining={seconds_until_next_reminder}
              totalSeconds={interval_minutes * 60}
              size={130}
              strokeWidth={8}
            />
            <p className="text-[11px] text-zinc-500 mt-4 leading-relaxed">
              Bot automatically checks for replies every 5 seconds.
            </p>
          </GlassCard>

          {/* Stats summary */}
          <GlassCard className="p-4 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Debt Details
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Total Owed</span>
                <span className="font-bold text-white font-mono">₹{amount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">Reminders Sent</span>
                <span className="font-medium text-white">{reminders_sent}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-400">UPI ID</span>
                <span className="font-mono text-zinc-300">{upi_id || "None"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Auto-Detect Payment</span>
                <span className="text-emerald-400 font-semibold">Enabled ✅</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Live Chat Activity & Simulator */}
        <div className="space-y-4 md:col-span-2">
          <GlassCard className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white tracking-tight">
                  Live WhatsApp Chat Stream
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">
                {messages.length} messages
              </span>
            </div>

            {/* Chat list */}
            <ActivityFeed messages={messages} onOpenQR={onOpenQR} />

            {/* Simulated incoming replies tray */}
            <div className="pt-3 border-t border-white/10 mt-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  🧪 Test & Simulate Reply
                </span>
                <span className="text-[10px] text-zinc-500">
                  Simulate contact's WhatsApp message
                </span>
              </div>

              {/* Quick simulation pill chips */}
              <div className="flex flex-wrap gap-1.5">
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendSimulatedReply(qr.text)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 transition-colors apple-press"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* Custom message input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendSimulatedReply(customReply);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={customReply}
                  onChange={(e) => setCustomReply(e.target.value)}
                  placeholder="Type friend's reply (e.g. 'bhej diya bhai')..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-white/30"
                />
                <SpringButton
                  type="submit"
                  size="sm"
                  variant="primary"
                  icon={Send}
                >
                  Send
                </SpringButton>
              </form>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Stop Confirmation Modal */}
      <BottomSheet
        isOpen={showStopConfirm}
        onClose={() => setShowStopConfirm(false)}
        title="Stop Reminder Bot?"
      >
        <div className="space-y-4 pt-1 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm text-zinc-300">
            Are you sure you want to stop reminders for <strong className="text-white">{name}</strong>?
            You can always start a new reminder later.
          </p>
          <div className="flex gap-3 pt-2">
            <SpringButton
              variant="secondary"
              className="flex-1"
              size="md"
              onClick={() => setShowStopConfirm(false)}
            >
              Cancel
            </SpringButton>
            <SpringButton
              variant="danger"
              className="flex-1"
              size="md"
              onClick={() => {
                setShowStopConfirm(false);
                onStopBot();
              }}
            >
              Confirm Stop
            </SpringButton>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
