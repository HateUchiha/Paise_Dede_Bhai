import React from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";
import { AlertTriangle } from "lucide-react";

export const IntentNoticeModal = ({ isOpen, onClose, title, contactName, replyText, body, confirmLabel, onConfirm }) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-lg">
      <div className="space-y-4 pt-1 text-center">
        <div className="w-14 h-14 rounded-3xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white">{contactName}</h3>
        <p className="text-xs text-zinc-400">{body}</p>
        {replyText && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left text-sm italic text-white">
            “{replyText}”
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <SpringButton variant="secondary" className="flex-1" onClick={onClose}>
            Continue reminders
          </SpringButton>
          {onConfirm && (
            <SpringButton variant="primary" className="flex-1" onClick={onConfirm}>
              {confirmLabel || "Pause"}
            </SpringButton>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
