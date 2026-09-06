import React, { useState, useEffect } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { ActivityFeed } from "../ui/ActivityFeed";
import { SpringButton } from "../ui/SpringButton";
import { CheckCircle2, QrCode, Send } from "lucide-react";
import { api } from "../../lib/api";

export const SessionDetailModal = ({
  isOpen,
  onClose,
  session,
  onSimulateReply,
  onConfirmClose,
  onOpenQR,
}) => {
  const [messages, setMessages] = useState([]);
  const [customReply, setCustomReply] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchMessages = async () => {
    if (!session?.id) return;
    setLoadingMessages(true);
    try {
      const data = await api.get(`/api/sessions/${session.id}/messages`);
      setMessages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isOpen && session?.id) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, session?.id]);

  if (!session) return null;

  const quickReplies = [
    { label: "✅ 'Bhej diya'", text: "bhej diya hai bhai check karlo" },
    { label: "📲 'Send QR'", text: "send qr code please" },
    { label: "📅 'Kal pakka'", text: "kal pakka de dunga bhai promise" },
    { label: "⏳ 'Thoda time do'", text: "thoda time do next week de dunga" },
    { label: "❌ 'Nahi dunga'", text: "nahi dunga bhai bhul ja" },
  ];

  const handleSendSim = (text) => {
    if (!text.trim()) return;
    onSimulateReply(session.id, text);
    setCustomReply("");
    setTimeout(fetchMessages, 500);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Live Stream: ${session.whatsapp_name}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 pt-1">
        {/* Session Stats Header */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-400">Target Contact</span>
            <div className="font-bold text-white text-sm">{session.whatsapp_name}</div>
          </div>
          <div>
            <span className="text-zinc-400">Balance</span>
            <div className="font-bold text-white font-mono text-sm">
              ₹{Number(session.balance || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <span className="text-zinc-400">Pings Sent</span>
            <div className="font-bold text-white font-mono text-sm">
              {session.reminders_sent}
            </div>
          </div>
          <div className="flex gap-1.5">
            {session.qr_filename && (
              <button
                onClick={() => onOpenQR(session.qr_filename)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300"
                title="View UPI QR"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onConfirmClose(session)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 text-xs shadow-sm flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Settle &amp; Close</span>
            </button>
          </div>
        </div>

        {/* Live WhatsApp Messages */}
        <div className="rounded-2xl bg-black/30 border border-white/5 p-2">
          <ActivityFeed messages={messages} onOpenQR={onOpenQR} />
        </div>

        {/* Test Simulator Tray */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              🧪 Simulate Incoming WhatsApp Reply
            </span>
            <span className="text-[10px] text-zinc-500">
              Test intent classification &amp; user cross-confirm
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {quickReplies.map((qr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendSim(qr.text)}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 transition-colors apple-press"
              >
                {qr.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendSim(customReply);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={customReply}
              onChange={(e) => setCustomReply(e.target.value)}
              placeholder="Type simulated reply (e.g. 'bhej diya bhai')..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
            <SpringButton type="submit" size="sm" variant="primary" icon={Send}>
              Send
            </SpringButton>
          </form>
        </div>
      </div>
    </BottomSheet>
  );
};
