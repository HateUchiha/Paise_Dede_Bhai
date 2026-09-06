import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnalyticsDashboard } from "./components/dashboard/AnalyticsDashboard";
import { MasterDebtTable } from "./components/debts/MasterDebtTable";
import { DebtLedger } from "./components/debts/DebtLedger";
import { AddEntryModal } from "./components/debts/AddEntryModal";
import { NewDebtModal } from "./components/debts/NewDebtModal";
import { MessageApprovalModal } from "./components/ai/MessageApprovalModal";
import { SessionsGrid } from "./components/sessions/SessionsGrid";
import { SessionDetailModal } from "./components/sessions/SessionDetailModal";
import { PaymentConfirmModal } from "./components/alerts/PaymentConfirmModal";
import { PromiseAlertModal } from "./components/alerts/PromiseAlertModal";
import { LoginModal } from "./components/auth/LoginModal";
import { WhatsAppConnectSheet } from "./components/whatsapp/WhatsAppConnectSheet";
import { QRPreviewModal } from "./components/ui/QRPreviewModal";
import {
  Activity,
  BarChart3,
  Bot,
  Database,
  History,
  LayoutDashboard,
  LogOut,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { signInWithGoogle, signOutUser, subscribeToAuthChanges } from "./lib/supabase";

export default function App() {

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, debts, sessions

  // Core Data State
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [debts, setDebts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [whatsappConnected, setWhatsappConnected] = useState(true);

  // Modals State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showNewDebtModal, setShowNewDebtModal] = useState(false);
  const [selectedLedgerDebt, setSelectedLedgerDebt] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [targetAddEntryDebt, setTargetAddEntryDebt] = useState(null);
  const [targetApprovalDebt, setTargetApprovalDebt] = useState(null);
  const [detailSession, setDetailSession] = useState(null);
  const [paymentAlertData, setPaymentAlertData] = useState(null);
  const [promiseAlertData, setPromiseAlertData] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);

  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // Initial Data Fetching
  const refreshAll = async () => {
    try {
      const [userRes, metricsRes, debtsRes, contactsRes, sessionsRes, waRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/metrics"),
        fetch("/api/debts"),
        fetch("/api/contacts"),
        fetch("/api/sessions"),
        fetch("/api/whatsapp/status"),
      ]);

      if (userRes.ok) setUser(await userRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (debtsRes.ok) setDebts(await debtsRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
      if (sessionsRes.ok) setSessions(await sessionsRes.json());
      if (waRes.ok) {
        const waData = await waRes.json();
        setWhatsappConnected(waData.connected);
      }
    } catch (e) {
      console.error("Error refreshing data:", e);
    }
  };

  useEffect(() => {
    refreshAll();
    const unsubscribe = subscribeToAuthChanges(() => {
      refreshAll();
    });
    return () => unsubscribe();
  }, []);


  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/live`;
    let reconnectTimer = null;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === "alert_payment_cross_confirm") {
              setPaymentAlertData(data);
              refreshAll();
            } else if (data.type === "alert_promise_date") {
              setPromiseAlertData(data);
              refreshAll();
            } else if (
              data.type === "session_updated" ||
              data.type === "session_status_changed" ||
              data.type === "new_message"
            ) {
              refreshAll();
            } else if (data.type === "whatsapp_status_changed") {
              setWhatsappConnected(data.connected);
            }
          } catch (err) {
            console.error(err);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (e) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Handlers
  const handleOpenLedger = async (debt) => {
    setSelectedLedgerDebt(debt);
    try {
      const res = await fetch(`/api/debts/${debt.id}/entries`);
      if (res.ok) {
        setLedgerEntries(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEntry = (debt) => {
    setTargetAddEntryDebt(debt);
  };

  const handleSaveEntry = async (debtId, entryData) => {
    try {
      await fetch(`/api/debts/${debtId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });
      refreshAll();
      if (selectedLedgerDebt && selectedLedgerDebt.id === debtId) {
        handleOpenLedger(selectedLedgerDebt);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateEntry = async (entryId, entryData) => {
    try {
      await fetch(`/api/entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });
      refreshAll();
      if (selectedLedgerDebt) {
        handleOpenLedger(selectedLedgerDebt);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      refreshAll();
      if (selectedLedgerDebt) {
        handleOpenLedger(selectedLedgerDebt);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNewDebt = async (debtData) => {
    try {
      await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(debtData),
      });
      refreshAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchSession = async (sessionConfig) => {
    try {
      await fetch("/api/sessions/start-with-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionConfig),
      });
      refreshAll();
      setActiveTab("sessions");
    } catch (e) {
      console.error(e);
    }
  };

  const handlePauseSession = async (id) => {
    await fetch(`/api/sessions/${id}/pause`, { method: "POST" });
    refreshAll();
  };

  const handleResumeSession = async (id) => {
    await fetch(`/api/sessions/${id}/resume`, { method: "POST" });
    refreshAll();
  };

  const handleStopSession = async (id) => {
    await fetch(`/api/sessions/${id}/stop`, { method: "POST" });
    refreshAll();
  };

  const handleSimulateReply = async (sessionId, replyText) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/simulate-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply_text: replyText }),
      });
      const data = await res.json();
      if (data.type === "alert_payment_cross_confirm") {
        setPaymentAlertData(data);
      } else if (data.type === "alert_promise_date") {
        setPromiseAlertData(data);
      }
      refreshAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmClose = async (sessionId, confirmationData) => {
    try {
      await fetch(`/api/sessions/${sessionId}/confirm-close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(confirmationData),
      });
      setPaymentAlertData(null);
      setDetailSession(null);
      refreshAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      refreshAll();
    } catch (err) {
      console.error("SSO Login error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      setUser(null);
      refreshAll();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };


  const handleWhatsAppConnect = async () => {
    await fetch("/api/whatsapp/connect", { method: "POST" });
    refreshAll();
  };

  const handleWhatsAppDisconnect = async () => {
    await fetch("/api/whatsapp/disconnect", { method: "POST" });
    refreshAll();
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#f5f5f7] relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Apple dynamic ambient backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-purple-600/10 blur-[130px] rounded-full" />
        <div className="absolute -bottom-40 right-10 w-[600px] h-[600px] bg-emerald-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col min-h-screen">
        {/* Header Navigation */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Logo & Branding */}
          <div
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3.5 cursor-pointer select-none group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-lg group-hover:scale-105 transition-transform">
              💸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-none">
                  Paisa Dede Bhai
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.0 Pro
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
                <span>Developed by</span>
                <strong className="text-zinc-200">ZQG365 Application Services</strong>
              </p>
            </div>
          </div>

          {/* Navigation Pill */}
          <nav className="glass-panel rounded-full p-1 flex items-center gap-1 shadow-lg">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "debts", label: "Master Debts", icon: Database },
              {
                id: "sessions",
                label: "Live Monitor",
                icon: Activity,
                badge: metrics.active_sessions_count > 0 ? metrics.active_sessions_count : null,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all apple-press ${
                    isActive ? "text-zinc-950 font-bold" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 bg-white rounded-full shadow-md z-0"
                      transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-zinc-950 text-[10px] font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Top Actions: WhatsApp Status & SSO User Profile */}
          <div className="flex items-center gap-2.5">
            {/* Secure WhatsApp Login Button */}
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium border transition-all apple-press ${
                whatsappConnected
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
              }`}
              title="Secure WhatsApp Web Session"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{whatsappConnected ? "WhatsApp Linked ✅" : "Link WhatsApp ⚠️"}</span>
            </button>

            {/* Google SSO Login / User Avatar */}
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all apple-press shadow-sm"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden bg-zinc-800">
                <img
                  src={user?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=ZQG365"}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden sm:inline">{user?.display_name || "Sign In"}</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="space-y-6"
              >
                <AnalyticsDashboard metrics={metrics} debts={debts} />
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Master Debts Overview
                    </h3>
                    <button
                      onClick={() => setActiveTab("debts")}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      View Full Table →
                    </button>
                  </div>
                  <MasterDebtTable
                    debts={debts}
                    onOpenLedger={handleOpenLedger}
                    onAddEntry={handleAddEntry}
                    onStartReminder={(debt) => setTargetApprovalDebt(debt)}
                    onNewDebt={() => setShowNewDebtModal(true)}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "debts" && (
              <motion.div
                key="debts"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Master Debt Table &amp; Contacts
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Manage money owed, audit logs, comments, and initiate AI reminder bots per contact.
                    </p>
                  </div>
                </div>

                <MasterDebtTable
                  debts={debts}
                  onOpenLedger={handleOpenLedger}
                  onAddEntry={handleAddEntry}
                  onStartReminder={(debt) => setTargetApprovalDebt(debt)}
                  onNewDebt={() => setShowNewDebtModal(true)}
                />
              </motion.div>
            )}

            {activeTab === "sessions" && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <SessionsGrid
                  sessions={sessions}
                  onOpenDetail={(s) => setDetailSession(s)}
                  onPause={handlePauseSession}
                  onResume={handleResumeSession}
                  onStop={handleStopSession}
                  onOpenQR={(fn) => setSelectedQR(fn)}
                  onRefresh={refreshAll}
                  onNewReminder={() => setActiveTab("debts")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Global Modals */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          user={user}
          onLogin={handleGoogleLogin}
          onLogout={handleLogout}
        />


        <WhatsAppConnectSheet
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          isConnected={whatsappConnected}
          onConnect={handleWhatsAppConnect}
          onDisconnect={handleWhatsAppDisconnect}
        />

        <NewDebtModal
          isOpen={showNewDebtModal}
          onClose={() => setShowNewDebtModal(false)}
          contacts={contacts}
          onSaveDebt={handleCreateNewDebt}
        />

        <DebtLedger
          isOpen={Boolean(selectedLedgerDebt)}
          onClose={() => setSelectedLedgerDebt(null)}
          debt={selectedLedgerDebt}
          entries={ledgerEntries}
          onAddEntry={handleAddEntry}
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteEntry}
        />

        <AddEntryModal
          isOpen={Boolean(targetAddEntryDebt)}
          onClose={() => setTargetAddEntryDebt(null)}
          debt={targetAddEntryDebt}
          onSave={handleSaveEntry}
        />

        <MessageApprovalModal
          isOpen={Boolean(targetApprovalDebt)}
          onClose={() => setTargetApprovalDebt(null)}
          debt={targetApprovalDebt}
          onLaunchSession={handleLaunchSession}
        />

        <SessionDetailModal
          isOpen={Boolean(detailSession)}
          onClose={() => setDetailSession(null)}
          session={detailSession}
          onSimulateReply={handleSimulateReply}
          onConfirmClose={(s) => {
            setPaymentAlertData({
              session_id: s.id,
              contact_name: s.whatsapp_name,
              debt_id: s.debt_id,
              balance: s.balance,
              reply_text: s.last_message_text || "Manual user settlement confirmation",
            });
          }}
          onOpenQR={(fn) => setSelectedQR(fn)}
        />

        <PaymentConfirmModal
          isOpen={Boolean(paymentAlertData)}
          onClose={() => setPaymentAlertData(null)}
          alertData={paymentAlertData}
          onConfirmClose={handleConfirmClose}
        />

        <PromiseAlertModal
          isOpen={Boolean(promiseAlertData)}
          onClose={() => setPromiseAlertData(null)}
          alertData={promiseAlertData}
          onPauseSession={handlePauseSession}
        />

        <QRPreviewModal
          isOpen={Boolean(selectedQR)}
          onClose={() => setSelectedQR(null)}
          qrFilename={selectedQR}
          amount={selectedLedgerDebt?.balance}
          name={selectedLedgerDebt?.whatsapp_name}
        />

        {/* Global Footer */}
        <footer className="mt-16 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
          <div className="flex items-center gap-2">
            <span>Paisa Dede Bhai</span>
            <span>•</span>
            <span className="text-zinc-400 font-semibold">
              Developed by ZQG365 Application Services
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-zinc-500 font-mono">
              Status: <span className="text-emerald-400 font-semibold">Live Engine</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  wsConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span>{wsConnected ? "WebSocket Connected" : "Connecting..."}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
