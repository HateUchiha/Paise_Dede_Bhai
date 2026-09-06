import React, { useState } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";

export const AddEntryModal = ({ isOpen, onClose, debt, onSave }) => {
  const [entryType, setEntryType] = useState("lent");
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  if (!debt) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!comment.trim()) {
      setError("Comment is required for the debt log audit trail.");
      return;
    }

    onSave(debt.id, {
      entry_type: entryType,
      amount: Number(amount),
      comment: comment.trim(),
      entry_date: entryDate,
    });

    setAmount("");
    setComment("");
    setError("");
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Add Entry for ${debt.whatsapp_name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1.5">
            Entry Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "lent", label: "Money Lent (+)" },
              { id: "payment", label: "Payment (-)" },
              { id: "adjustment", label: "Adjustment" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEntryType(t.id)}
                className={`py-2 rounded-xl text-xs font-medium border text-center transition-all apple-press ${
                  entryType === t.id
                    ? "bg-white text-zinc-950 font-bold border-white shadow-sm"
                    : "bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Date
            </label>
            <input
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1.5">
            Comment / Reason (Required Log)
          </label>
          <input
            type="text"
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Goa dinner bill share or Google Pay partial receipt"
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="pt-2 flex gap-3">
          <SpringButton variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </SpringButton>
          <SpringButton variant="primary" size="md" type="submit" className="flex-1">
            Save Entry
          </SpringButton>
        </div>
      </form>
    </BottomSheet>
  );
};
