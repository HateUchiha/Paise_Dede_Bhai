import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";

export const LoginScreen = ({ onGoogleLogin, loading }) => {
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setBusy(true);
    try {
      await onGoogleLogin();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-[#f5f5f7] relative overflow-hidden flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-gradient-to-b from-indigo-500/20 via-sky-500/10 to-transparent blur-[130px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-emerald-500/10 blur-[140px] rounded-full" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="w-full max-w-md glass-panel rounded-[32px] p-8 text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/15 mx-auto flex items-center justify-center text-3xl shadow-lg mb-5">
            💸
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white m-0">Paisa Dede Bhai</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Multi-session WhatsApp debt recovery. Because “kal de dunga” has gone on long enough.
          </p>

          <button
            onClick={handleLogin}
            disabled={busy || loading}
            className="mt-8 w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.25)] apple-press disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            {busy || loading ? "Signing in…" : "Continue with Google"}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>SSO via Supabase Auth when configured · local demo login otherwise</span>
          </div>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl text-left">
          {[
            { icon: "📒", title: "Master ledger", copy: "Track every lent, payment, and adjustment with comments." },
            { icon: "🤖", title: "Approved AI pings", copy: "Groq writes 10 messages. You approve. The bot never improvises." },
            { icon: "📡", title: "Live sessions", copy: "Multiple contacts, one WhatsApp login, intent alerts in real time." },
          ].map((card) => (
            <div key={card.title} className="glass-panel rounded-2xl p-4">
              <div className="text-lg mb-1">{card.icon}</div>
              <div className="text-sm font-semibold text-white">{card.title}</div>
              <p className="text-[11px] text-zinc-400 mt-1">{card.copy}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="relative z-10 py-6 text-center text-[11px] text-zinc-500">
        <Sparkles className="w-3 h-3 inline mr-1 text-zinc-600" />
        Developed by <strong className="text-zinc-300">ZQG365 Application Services</strong>
      </footer>
    </div>
  );
};
