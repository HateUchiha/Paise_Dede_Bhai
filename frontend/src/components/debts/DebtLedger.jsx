import React, { useState } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";
import {
  Calendar,
  Check,
  Edit2,
  FileText,
  Plus,
  Trash2,
  X,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export const DebtLedger = ({
  isOpen,
  onClose,
  debt,
  entries = [],
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [editDate, setEditDate] = useState("");

  if (!debt) return null;

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditAmount(entry.amount);
    setEditComment(entry.comment);
    setEditDate(entry.entry_date);
  };

  const saveEdit = (id) => {
    onUpdateEntry(id, {
      amount: Number(editAmount),
      comment: editComment.trim(),
      entry_date: editDate,
    });
    setEditingId(null);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Debt Ledger: ${debt.whatsapp_name}`} maxWidth="max-w-2xl">
      <div className="space-y-4 pt-1">
        {/* Top summary card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400">Current Outstanding Balance</span>
            <div className="text-2xl font-bold text-white font-mono">
              ₹{Number(debt.balance || (debt.total_amount - debt.amount_recovered)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-zinc-500">
              Total Lent: ₹{debt.total_amount?.toLocaleString("en-IN")} • Recovered: ₹{debt.amount_recovered?.toLocaleString("en-IN")}
            </span>
          </div>

          <SpringButton
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => onAddEntry(debt)}
          >
            Add Entry
          </SpringButton>
        </div>

        {/* Entries list */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No entries logged for this debt yet.
            </div>
          ) : (
            entries.map((entry) => {
              const isEditing = editingId === entry.id;
              const isPayment = entry.entry_type === "payment";
              const isLent = entry.entry_type === "lent";

              return (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors space-y-2"
                >
                  {isEditing ? (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-semibold">Amount (₹)</label>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/40 border border-white/20 rounded-xl text-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-semibold">Date</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-3 py-1.5 bg-black/40 border border-white/20 rounded-xl text-white text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase font-semibold">Comment / Note</label>
                        <input
                          type="text"
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full px-3 py-1.5 bg-black/40 border border-white/20 rounded-xl text-white text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 rounded-xl bg-white/10 text-zinc-300 text-xs hover:bg-white/20"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(entry.id)}
                          className="px-3 py-1 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-xs hover:bg-emerald-400"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isPayment
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {isPayment ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">
                              {isPayment ? "Payment Received" : isLent ? "Money Lent" : "Adjustment"}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-zinc-500" />
                              {entry.entry_date}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                            {entry.comment}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`text-base font-bold font-mono ${
                            isPayment ? "text-emerald-400" : "text-white"
                          }`}
                        >
                          {isPayment ? "-" : "+"}₹{Number(entry.amount).toLocaleString("en-IN")}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(entry)}
                            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Delete this ledger entry?")) {
                                onDeleteEntry(entry.id);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
