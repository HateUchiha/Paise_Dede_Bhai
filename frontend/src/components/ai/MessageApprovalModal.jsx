import React, { useEffect, useState } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";
import { RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { api } from "../../lib/api";

export const MessageApprovalModal = ({
  isOpen,
  onClose,
  debt,
  onLaunchSession,
}) => {
  const [tone, setTone] = useState(debt?.tone || "casual");
  const [language, setLanguage] = useState(debt?.language || "hindi");
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
  const [generatedMessages, setGeneratedMessages] = useState([]);
  const [approvedIndices, setApprovedIndices] = useState({});
  const [editedMessages, setEditedMessages] = useState({});

  useEffect(() => {
    setTone(debt?.tone || "casual");
    setLanguage(debt?.language || "hindi");
    setGeneratedMessages([]);
    setApprovedIndices({});
    setEditedMessages({});
  }, [debt?.id]);

  if (!debt) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await api.post("/api/ai/generate-messages", {
        contact_name: debt.whatsapp_name,
        amount: debt.balance || debt.total_amount - debt.amount_recovered,
        tone,
        language,
      });
      setGeneratedMessages(data.messages || []);

      // Auto-approve all 10 by default so user can quickly review/uncheck
      const initialApproved = {};
      (data.messages || []).forEach((_, idx) => {
        initialApproved[idx] = true;
      });
      setApprovedIndices(initialApproved);
      setEditedMessages({});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleApprove = (idx) => {
    setApprovedIndices((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleMessageEdit = (idx, text) => {
    setEditedMessages((prev) => ({
      ...prev,
      [idx]: text,
    }));
  };

  const approvedList = generatedMessages
    .map((msg, idx) => (approvedIndices[idx] ? editedMessages[idx] || msg : null))
    .filter(Boolean);

  const handleLaunch = () => {
    if (approvedList.length < 3) return;
    onLaunchSession({
      debt_id: debt.id,
      contact_id: debt.contact_id,
      interval_minutes: Number(intervalMinutes),
      language,
      tone,
      approved_messages: approvedList,
    });
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`AI Reminder Setup: ${debt.whatsapp_name}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 pt-1">
        {/* Guardrail Banner */}
        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>
            <strong>Strict Guardrail:</strong> Messages are sent <em>only</em> to{" "}
            <strong>{debt.whatsapp_name}</strong> from your approved list. The payment QR will be sent with your first reminder.
          </span>
        </div>

        {/* Configuration selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tone */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
              Reminder Tone
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
              {[
                { id: "casual", label: "Casual 😊" },
                { id: "serious", label: "Serious 😤" },
                { id: "angry", label: "Angry 🔥" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    tone === t.id
                      ? "bg-white text-zinc-950 font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
              Language
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
              {[
                { id: "hindi", label: "Hindi" },
                { id: "bengali", label: "Bengali" },
                { id: "english", label: "English" },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLanguage(l.id)}
                  className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    language === l.id
                      ? "bg-white text-zinc-950 font-bold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
              Frequency
            </label>
            <select
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(Number(e.target.value))}
              className="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none"
            >
              <option value="15" className="bg-zinc-900 text-white">Every 15 min</option>
              <option value="30" className="bg-zinc-900 text-white">Every 30 min</option>
              <option value="60" className="bg-zinc-900 text-white">Every 1 hour</option>
              <option value="120" className="bg-zinc-900 text-white">Every 2 hours</option>
              <option value="240" className="bg-zinc-900 text-white">Every 4 hours</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-zinc-400">
            {generatedMessages.length > 0
              ? `${approvedList.length} of 10 approved (minimum 3)`
              : "Generate 10 custom messages with Groq / local templates"}
          </span>

          <SpringButton
            variant="secondary"
            size="sm"
            icon={loading ? RefreshCw : Sparkles}
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : generatedMessages.length > 0 ? "Regenerate 10" : "Generate 10 Messages"}
          </SpringButton>
        </div>

        {/* Messages Approval List */}
        {generatedMessages.length > 0 && (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {generatedMessages.map((msg, idx) => {
              const isApproved = approvedIndices[idx];
              const currentText = editedMessages[idx] || msg;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    isApproved
                      ? "bg-white/5 border-emerald-500/40 text-white shadow-sm"
                      : "bg-white/[0.02] border-white/5 text-zinc-500 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={Boolean(isApproved)}
                      onChange={() => toggleApprove(idx)}
                      className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                    />

                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-semibold text-zinc-400">
                          Message #{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            isApproved ? "text-emerald-400" : "text-zinc-500"
                          }`}
                        >
                          {isApproved ? "Approved ✅" : "Excluded ❌"}
                        </span>
                      </div>

                      <textarea
                        value={currentText}
                        onChange={(e) => handleMessageEdit(idx, e.target.value)}
                        rows={2}
                        className="w-full bg-transparent border-0 p-0 text-xs text-zinc-200 focus:ring-0 resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Footer */}
        <div className="pt-2 flex gap-3">
          <SpringButton variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </SpringButton>
          <SpringButton
            variant="primary"
            size="md"
            className="flex-1 shadow-[0_4px_25px_rgba(255,255,255,0.2)]"
            disabled={approvedList.length < 3}
            onClick={handleLaunch}
          >
            Approve ({approvedList.length}) &amp; Launch Bot 🚀
          </SpringButton>
        </div>
      </div>
    </BottomSheet>
  );
};
