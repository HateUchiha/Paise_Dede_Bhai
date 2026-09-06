import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, QrCode, Sparkles } from "lucide-react";

export const ActivityFeed = ({ messages = [], onOpenQR }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[340px] overflow-y-auto px-2 py-3 space-y-3">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
            💬
          </div>
          <p>No activity yet. Starting reminder sequence...</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isBot = msg.sender === "bot";
            const kind = msg.message_type || msg.type;
            const isSettled = kind === "payment_settled" || kind === "payment_confirmed";
            const isQR = kind === "qr_sent";

            return (
              <motion.div
                key={msg.id || Math.random()}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                }}
                className={`flex flex-col ${isBot ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm relative backdrop-blur-xl transition-all shadow-md ${
                    isSettled
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 shadow-[0_4px_20px_rgba(16,185,129,0.2)]"
                      : isQR
                      ? "bg-indigo-600/30 border border-indigo-400/30 text-indigo-100"
                      : isBot
                      ? "bg-blue-600/30 border border-blue-400/30 text-white"
                      : "bg-white/10 border border-white/10 text-zinc-200"
                  }`}
                >
                  {isSettled && (
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> Payment Detected
                    </div>
                  )}

                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {isQR && msg.qr_filename && (
                    <button
                      onClick={() => onOpenQR?.(msg.qr_filename)}
                      className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors border border-white/10"
                    >
                      <QrCode className="w-3.5 h-3.5" /> View Attached UPI QR
                    </button>
                  )}

                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-zinc-400">
                    <span>{msg.timestamp}</span>
                    {isBot && <CheckCheck className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
      <div ref={endRef} />
    </div>
  );
};
