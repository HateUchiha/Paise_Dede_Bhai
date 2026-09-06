import React, { useEffect, useState } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";
import { CheckCircle2, DollarSign, HelpCircle, ShieldAlert } from "lucide-react";

export const PaymentConfirmModal = ({
  isOpen,
  onClose,
  alertData,
  onConfirmClose,
}) => {
  const [recordPayment, setRecordPayment] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState(alertData?.balance || 0);
  const [paymentComment, setPaymentComment] = useState("Full settlement confirmed by user via WhatsApp reply");

  useEffect(() => {
    setPaymentAmount(alertData?.balance || 0);
    setRecordPayment(true);
  }, [alertData]);

  if (!alertData) return null;

  const handleConfirm = () => {
    onConfirmClose(alertData.session_id, {
      record_payment: recordPayment,
      payment_amount: Number(paymentAmount),
      payment_comment: paymentComment.trim(),
    });
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Verification Alert"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 pt-1 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Did {alertData.contact_name} pay you?
          </h3>
          <p className="text-xs text-zinc-300">
            Our AI detected a payment confirmation reply from WhatsApp:
          </p>
        </div>

        {/* Incoming message quote */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>Incoming Message</span>
            <span className="text-emerald-400 font-semibold">Intent: Paid ✅</span>
          </div>
          <p className="text-sm font-medium text-white italic">
            "{alertData.reply_text}"
          </p>
        </div>

        {/* Payment entry options */}
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-left space-y-3">
          <label className="flex items-center gap-2.5 text-xs text-zinc-200 cursor-pointer">
            <input
              type="checkbox"
              checked={recordPayment}
              onChange={(e) => setRecordPayment(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
            />
            <span className="font-semibold">Record this payment in the Debt Ledger</span>
          </label>

          {recordPayment && (
            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/20 rounded-xl text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase font-semibold block mb-1">
                  Ledger Comment
                </label>
                <input
                  type="text"
                  value={paymentComment}
                  onChange={(e) => setPaymentComment(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/20 rounded-xl text-white text-xs"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex gap-3">
          <SpringButton
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={onClose}
          >
            Not Paid Yet (Keep Open)
          </SpringButton>
          <SpringButton
            variant="primary"
            size="md"
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
            icon={CheckCircle2}
            onClick={handleConfirm}
          >
            Confirm &amp; Settle
          </SpringButton>
        </div>
      </div>
    </BottomSheet>
  );
};
