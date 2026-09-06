import React, { useEffect, useState } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";

export const AddContactSheet = ({ isOpen, onClose, contact, onSave }) => {
  const [whatsappName, setWhatsappName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState("hindi");
  const [tone, setTone] = useState("casual");

  useEffect(() => {
    if (contact) {
      setWhatsappName(contact.whatsapp_name || "");
      setDisplayName(contact.display_name || "");
      setUpiId(contact.upi_id || "");
      setPhone(contact.phone || "");
      setLanguage(contact.language || "hindi");
      setTone(contact.tone || "casual");
    } else {
      setWhatsappName("");
      setDisplayName("");
      setUpiId("");
      setPhone("");
      setLanguage("hindi");
      setTone("casual");
    }
  }, [contact, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      whatsapp_name: whatsappName.trim(),
      display_name: displayName.trim() || undefined,
      upi_id: upiId.trim() || undefined,
      phone: phone.trim() || undefined,
      language,
      tone,
    });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={contact ? "Edit Contact" : "Add Contact"}>
      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div>
          <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            WhatsApp name (exact)
          </label>
          <input
            required
            value={whatsappName}
            onChange={(e) => setWhatsappName(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none"
            placeholder="Name as it appears in WhatsApp"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Alias</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">UPI ID</label>
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs"
          >
            <option value="hindi">Hindi</option>
            <option value="bengali">Bengali</option>
            <option value="english">English</option>
          </select>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs"
          >
            <option value="casual">Casual</option>
            <option value="serious">Serious</option>
            <option value="angry">Angry</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <SpringButton variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </SpringButton>
          <SpringButton variant="primary" className="flex-1" type="submit">
            Save Contact
          </SpringButton>
        </div>
      </form>
    </BottomSheet>
  );
};
