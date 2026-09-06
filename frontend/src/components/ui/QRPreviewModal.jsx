import React, { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { SpringButton } from "./SpringButton";
import { Check, Copy, Download, QrCode } from "lucide-react";

export const QRPreviewModal = ({ isOpen, onClose, qrFilename, upiId, amount, name }) => {
  const [copied, setCopied] = useState(false);
  const qrUrl = qrFilename ? `/api/qr/${qrFilename}` : null;

  const handleCopyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="UPI Payment QR">
      <div className="flex flex-col items-center text-center space-y-4 pt-2">
        <div className="p-4 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-zinc-200/50">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="UPI QR Code"
              className="w-56 h-56 rounded-2xl object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex flex-col items-center justify-center text-zinc-400">
              <QrCode className="w-12 h-12 mb-2" />
              <p className="text-xs">No QR Generated</p>
            </div>
          )}
        </div>

        <div>
          <div className="text-2xl font-bold text-white tracking-tight">
            ₹{amount ? Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0.00"}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Payable to {name || "Contact"}
          </p>
        </div>

        {upiId && (
          <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <span className="text-zinc-400 font-mono select-all truncate mr-2">
              {upiId}
            </span>
            <button
              onClick={handleCopyUpi}
              className="flex items-center gap-1 text-zinc-300 hover:text-white px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 transition-colors font-medium text-[11px]"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        <div className="flex gap-2 w-full pt-2">
          {qrUrl && (
            <a
              href={qrUrl}
              download={qrFilename || "upi_qr.png"}
              className="flex-1"
            >
              <SpringButton variant="secondary" className="w-full" size="md" icon={Download}>
                Save QR Image
              </SpringButton>
            </a>
          )}
          <SpringButton variant="primary" className="flex-1" size="md" onClick={onClose}>
            Done
          </SpringButton>
        </div>
      </div>
    </BottomSheet>
  );
};
