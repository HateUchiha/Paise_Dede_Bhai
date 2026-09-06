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

import React, { useState, useEffect } from "react";
import { BottomSheet } from "../ui/BottomSheet";
import { SpringButton } from "../ui/SpringButton";
import { CheckCircle2, QrCode, RefreshCw, Smartphone, Unlink } from "lucide-react";
import { api } from "../../lib/api";

export const WhatsAppConnectSheet = ({ isOpen, onClose, isConnected, onConnect, onDisconnect }) => {
  const [qrUrl, setQrUrl] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [flowType, setFlowType] = useState("personal"); // "personal" or "business"
  const [phoneId, setPhoneId] = useState("");

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

  // Fetch QR only for personal flow
  useEffect(() => {
    if (isOpen && !isConnected && flowType === "personal") {
      fetchQr();
      const poll = setInterval(async () => {
        try {
          const st = await api.get("/api/whatsapp/qr-status");
          if (st.logged_in) {
            onConnect?.();
          }
        } catch { /* ignore */ }
      }, 4000);
      return () => clearInterval(poll);
    }
  }, [isOpen, isConnected, flowType]);

  const linkBusiness = async () => {
    try {
      await api.post("/api/whatsapp/link", { type: "business", wa_id: phoneId });
      onConnect?.();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="WhatsApp Connection">
      <div className="space-y-4 p-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-zinc-300">Connection Type:</label>
          <select
            value={flowType}
            onChange={(e) => setFlowType(e.target.value)}
            className="bg-zinc-800 text-white rounded p-1"
          >
            <option value="personal">Personal (QR)</option>
            <option value="business">Business (Meta Cloud API)</option>
          </select>
        </div>
        {flowType === "business" && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-zinc-300">Phone Number ID:</label>
            <input
              type="text"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              placeholder="e.g., 1234567890"
              className="bg-zinc-800 text-white rounded p-1 flex-1"
            />
          </div>
        )}
        {isConnected ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
            <h3 className="text-xl font-bold text-white">WhatsApp Connected ✅</h3>
            <p className="text-sm text-zinc-300">Your WhatsApp is linked and ready.</p>
            <div className="flex gap-2 justify-center">
              <SpringButton variant="secondary" onClick={onClose}>Close</SpringButton>
              <SpringButton variant="danger" icon={Unlink} onClick={() => { onDisconnect(); onClose(); }}>Disconnect</SpringButton>
            </div>
          </div>
        ) : flowType === "personal" ? (
          <div className="space-y-4 text-center">
            <p className="text-xs text-zinc-400">
              Scan this QR code from <strong>WhatsApp &gt; Linked Devices &gt; Link a Device</strong> on your phone.
            </p>
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
            <div className="flex gap-2 justify-center">
              <SpringButton variant="secondary" icon={RefreshCw} onClick={fetchQr}>Refresh QR</SpringButton>
              <SpringButton variant="primary" icon={Smartphone} onClick={() => { onConnect(); onClose(); }}>Confirm Link</SpringButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-zinc-300">Business account linking via Meta Cloud API.</p>
            <SpringButton variant="primary" onClick={linkBusiness}>Link Business Account</SpringButton>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
