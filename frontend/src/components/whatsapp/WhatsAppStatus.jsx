import React from "react";
import { Smartphone } from "lucide-react";

export const WhatsAppStatus = ({ connected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill text-[11px] font-semibold apple-press"
    >
      <Smartphone className={`w-3.5 h-3.5 ${connected ? "text-emerald-400" : "text-amber-300"}`} />
      <span className={connected ? "text-emerald-300" : "text-amber-200"}>
        {connected ? "WhatsApp Linked" : "Link WhatsApp"}
      </span>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
    </button>
  );
};
