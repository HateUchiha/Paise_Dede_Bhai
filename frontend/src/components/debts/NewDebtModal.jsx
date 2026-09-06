import React, { useState } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";
import { api } from "../../lib/api";

export const NewDebtModal = ({ isOpen, onClose, contacts = [], onSaveDebt }) => {
  const [useExisting, setUseExisting] = useState(contacts.length > 0);
  const [selectedContactId, setSelectedContactId] = useState(contacts[0]?.id || "");
  
  // New contact fields
  const [whatsappName, setWhatsappName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [language, setLanguage] = useState("hindi");
  const [tone, setTone] = useState("casual");

  // Debt fields
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [comment, setComment] = useState("Initial debt registered");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    let contactId = selectedContactId;

    if (!useExisting || !contactId) {
      if (!whatsappName.trim()) {
        setError("WhatsApp contact name is required.");
        return;
      }

      // Create contact first
      try {
        const newContact = await api.post("/api/contacts", {
            whatsapp_name: whatsappName.trim(),
            display_name: displayName.trim() || undefined,
            upi_id: upiId.trim() || undefined,
            language,
            tone,
          });
        contactId = newContact.id;
      } catch (err) {
        setError("Failed to create contact.");
        return;
      }
    }

    onSaveDebt({
      contact_id: contactId,
      total_amount: Number(amount),
      notes: notes.trim(),
      initial_comment: comment.trim(),
    });

    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Register New Debt">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Contact selection toggle */}
        {contacts.length > 0 && (
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setUseExisting(true)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                useExisting ? "bg-white text-zinc-950 font-bold shadow-sm" : "text-zinc-400"
              }`}
            >
              Select Existing Contact
            </button>
            <button
              type="button"
              onClick={() => setUseExisting(false)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !useExisting ? "bg-white text-zinc-950 font-bold shadow-sm" : "text-zinc-400"
              }`}
            >
              + New Contact
            </button>
          </div>
        )}

        {useExisting && contacts.length > 0 ? (
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
              Select Contact
            </label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/30"
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                  {c.whatsapp_name} {c.display_name ? `(${c.display_name})` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
                WhatsApp Name (Exact)
              </label>
              <input
                type="text"
                required
                value={whatsappName}
                onChange={(e) => setWhatsappName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
                  UPI ID (Optional)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="rahul@upi"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs"
                >
                  <option value="hindi">Hindi</option>
                  <option value="bengali">Bengali</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Amount & Date */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
            Amount Owed (₹)
          </label>
          <input
            type="number"
            required
            min="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 2500"
            className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-bold font-mono focus:outline-none focus:border-white/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
            Debt Description / Reason
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Goa trip flight ticket or dinner split"
            className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-1">
            Ledger Comment (Audit Log)
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Initial money lent via NetBanking"
            className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none"
          />
        </div>

        <div className="pt-2 flex gap-3">
          <SpringButton variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </SpringButton>
          <SpringButton variant="primary" size="md" type="submit" className="flex-1">
            Create Debt
          </SpringButton>
        </div>
      </form>
    </BottomSheet>
  );
};
