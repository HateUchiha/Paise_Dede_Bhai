import React, { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { SpringButton } from "../ui/SpringButton";
import { Pencil, Plus, Trash2, User } from "lucide-react";

export const ContactList = ({ contacts = [], onAdd, onEdit, onDelete }) => {
  const [search, setSearch] = useState("");
  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.whatsapp_name || "").toLowerCase().includes(q) ||
      (c.display_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-sky-400" />
          Contacts
        </h2>
        <SpringButton variant="primary" size="sm" icon={Plus} onClick={onAdd}>
          Add Contact
        </SpringButton>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search WhatsApp name or alias…"
        className="w-full sm:max-w-xs px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-white text-xs placeholder-zinc-500 focus:outline-none"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <GlassCard className="p-8 text-center text-zinc-500 text-sm col-span-full">
            No contacts yet. Add a WhatsApp name exactly as it appears in chat.
          </GlassCard>
        ) : (
          filtered.map((c) => (
            <GlassCard key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{c.whatsapp_name}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {c.display_name || "No alias"} · {c.language} · {c.tone}
                  </div>
                  {c.upi_id && <div className="text-[11px] font-mono text-zinc-500 mt-1">{c.upi_id}</div>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onEdit(c)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${c.whatsapp_name}?`)) onDelete(c.id);
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-300 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};
