import React from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";
import { LogOut, ShieldCheck, UserCheck, Sparkles } from "lucide-react";

export const LoginModal = ({ isOpen, onClose, user, onLogin, onLogout }) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Account & SSO Login">
      <div className="space-y-6 pt-1 text-center">
        {user ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 mx-auto shadow-xl">
              <img
                src={user.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=ZQG365"}
                alt="Avatar"
                className="w-full h-full rounded-[22px] bg-zinc-900 object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{user.display_name}</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{user.email}</p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold mt-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Google SSO Authenticated</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-zinc-400 flex justify-between">
              <span>WhatsApp Session Context</span>
              <span className={user.whatsapp_logged_in ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                {user.whatsapp_logged_in ? "Active Linked ✅" : "Not Linked ⚠️"}
              </span>
            </div>

            <div className="pt-2">
              <SpringButton
                variant="danger"
                size="md"
                className="w-full"
                icon={LogOut}
                onClick={() => {
                  onLogout();
                  onClose();
                }}
              >
                Sign Out
              </SpringButton>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl mx-auto shadow-lg border border-white/10">
              🔐
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Single Sign-On (SSO)</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                Sign in with Google to manage your debts, sync WhatsApp sessions, and monitor reminders.
              </p>
            </div>

            <button
              onClick={() => {
                onLogin();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.25)] apple-press"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Google SSO with Supabase JWT &amp; Session Guardrails</span>
            </div>

            <div className="pt-2 text-[10px] text-zinc-500">
              Developed by <strong className="text-zinc-400">ZQG365 Application Services</strong>
            </div>
          </div>
        )}

      </div>
    </BottomSheet>
  );
};
