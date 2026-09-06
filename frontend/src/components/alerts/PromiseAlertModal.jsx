import React from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";
import { Calendar, Clock, Pause, Play } from "lucide-react";

export const PromiseAlertModal = ({
  isOpen,
  onClose,
  alertData,
  onPauseSession,
}) => {
  if (!alertData) return null;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Promise Alert"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 pt-1 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
          <Calendar className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {alertData.contact_name} promised to pay!
          </h3>
          <p className="text-xs text-zinc-300">
            Detected promise timeline:{" "}
            <strong className="text-blue-400 font-semibold">
              {alertData.promised_date || "Future date"}
            </strong>
          </p>
        </div>

        {/* Incoming message quote */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>Incoming Message</span>
            <span className="text-blue-400 font-semibold">Promise Detected 📅</span>
          </div>
          <p className="text-sm font-medium text-white italic">
            "{alertData.reply_text}"
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-zinc-400 text-left">
          Would you like to pause reminders until their promised timeline, or keep pinging on schedule?
        </div>

        <div className="pt-2 flex gap-3">
          <SpringButton
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={onClose}
          >
            Keep Pinging
          </SpringButton>
          <SpringButton
            variant="primary"
            size="md"
            className="flex-1"
            icon={Pause}
            onClick={() => {
              onPauseSession(alertData.session_id);
              onClose();
            }}
          >
            Pause Reminders
          </SpringButton>
        </div>
      </div>
    </BottomSheet>
  );
};
