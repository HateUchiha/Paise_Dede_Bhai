import React, { useState, useEffect } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";
import { CheckCircle2, QrCode, RefreshCw, Smartphone, Unlink } from "lucide-react";
import { api } from "../../lib/api";

export const WhatsAppConnectSheet = ({ isOpen, onClose, isConnected, onConnect, onDisconnect }) => {
  const [qrUrl, setQrUrl] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const fetchQr = async () => {
    setLoadingQr(true);
    try {
      const data = await api.get("/api/whatsapp/qr");
      setQrUrl(data.qr_url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQr(false);
    }
  };

  useEffect(() => {
    if (isOpen && !isConnected) {
      fetchQr();
      const poll = setInterval(async () => {
        try {
          const st = await api.get("/api/whatsapp/qr-status");
          if (st.logged_in) {
            onConnect?.();
          }
        } catch {
          /* ignore */
        }
      }, 4000);
      return () => clearInterval(poll);
    }
  }, [isOpen, isConnected]);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Secure WhatsApp Web Login">
      <div className="space-y-5 pt-1 text-center">
        {isConnected ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">WhatsApp Connected ✅</h3>
              <p className="text-xs text-zinc-300">
                Your WhatsApp Web profile is securely linked and persistent for automated reminders.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-zinc-400 space-y-2 text-left">
              <div className="flex justify-between">
                <span>Profile Status:</span>
                <span className="text-emerald-400 font-semibold">Active & Synced</span>
              </div>
              <div className="flex justify-between">
                <span>Direct Multi-Contact Routing:</span>
                <span className="text-white font-medium">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>Engine:</span>
                <span className="text-zinc-300">Chrome Selenium Driver</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <SpringButton
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={onClose}
              >
                Close
              </SpringButton>
              <SpringButton
                variant="danger"
                size="md"
                className="flex-1"
                icon={Unlink}
                onClick={() => {
                  onDisconnect();
                  onClose();
                }}
              >
                Disconnect Session
              </SpringButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-zinc-400">
                Scan this QR code from <strong>WhatsApp &gt; Linked Devices &gt; Link a Device</strong> on your phone.
              </p>
            </div>

            <div className="p-4 bg-white rounded-3xl inline-block mx-auto shadow-2xl border-4 border-emerald-500/20">
              {loadingQr ? (
                <div className="w-48 h-48 flex items-center justify-center text-zinc-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
              ) : qrUrl ? (
                <img
                  src={qrUrl}
                  alt="WhatsApp Linking QR"
                  className="w-48 h-48 rounded-2xl object-contain cursor-pointer hover:opacity-90"
                  onClick={onConnect}
                  title="Click to simulate instant scan!"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-zinc-400">
                  <QrCode className="w-10 h-10" />
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-500 italic">
              (Tip: Click QR or button below to simulate instant phone link)
            </p>

            <div className="pt-2 flex gap-3">
              <SpringButton
                variant="secondary"
                size="md"
                className="flex-1"
                icon={RefreshCw}
                onClick={fetchQr}
              >
                Refresh QR
              </SpringButton>
              <SpringButton
                variant="primary"
                size="md"
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
                icon={Smartphone}
                onClick={() => {
                  onConnect();
                  onClose();
                }}
              >
                Confirm Link
              </SpringButton>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
