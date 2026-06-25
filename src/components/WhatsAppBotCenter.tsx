import React, { useState, useEffect } from "react";
import { NotificationLog } from "../types";
import { 
  QrCode, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  MessageSquare, 
  Send, 
  Link as LinkIcon, 
  ExternalLink,
  ShieldAlert,
  Loader2,
  Clock
} from "lucide-react";
import { motion } from "motion/react";

export default function WhatsAppBotCenter() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [botStatus, setBotStatus] = useState<{
    status: "idle" | "initializing" | "ready" | "failed";
    qrCode: string | null;
    error: string | null;
  }>({ status: "idle", qrCode: null, error: null });
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isInitializingBot, setIsInitializingBot] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Fetch logs and bot status
  const fetchStatusAndLogs = async () => {
    try {
      const logsRes = await fetch("/api/notifications/logs");
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
      }

      const botRes = await fetch("/api/notifications/bot-status");
      if (botRes.ok) {
        const data = await botRes.json();
        setBotStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch notification states:", err);
    }
  };

  useEffect(() => {
    fetchStatusAndLogs();
    
    // Poll logs and bot status every 5 seconds for live feedback during QR scan
    const timer = setInterval(fetchStatusAndLogs, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleInitBot = async () => {
    setIsInitializingBot(true);
    try {
      const res = await fetch("/api/notifications/bot-init", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setBotStatus(data);
      }
    } catch (err) {
      console.error("Failed to initialize bot:", err);
    } finally {
      setIsInitializingBot(false);
    }
  };

  const handleResetLocks = async () => {
    if (!confirm("Möchtest du alle Match-Sperren und den Sendeverlauf zurücksetzen? Dadurch können dieselben Match-Benachrichtigungen beim nächsten Speichern erneut ausgelöst werden.")) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch("/api/notifications/reset-locks", { method: "POST" });
      if (res.ok) {
        setLogs([]);
        alert("Matchmaking-Sperren zurückgesetzt! Du kannst nun neue Tests durchführen.");
      }
    } catch (err) {
      console.error("Failed to reset locks:", err);
    } finally {
      setIsResetting(false);
    }
  };

  // Helper for status classes
  const getStatusBadge = (status: NotificationLog["status"]) => {
    switch (status) {
      case "sent":
        return (
          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-lg">
            Versendet
          </span>
        );
      case "failed":
        return (
          <span className="bg-rose-500/15 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2.5 py-1 rounded-lg">
            Fehlgeschlagen
          </span>
        );
      default:
        return (
          <span className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold px-2.5 py-1 rounded-lg">
            Simuliert
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="whatsapp-bot-center-root">
      
      {/* Bot Controller Panel */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/15 p-2 rounded-xl text-indigo-400 border border-indigo-500/10">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-100 uppercase tracking-wider">WhatsApp-Bot</h3>
              <p className="text-[10px] text-slate-400">Automatische Tauschbenachrichtigungen</p>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mt-5 space-y-3.5">
            {/* Connection Status Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Status:</span>
              {botStatus.status === "ready" && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle className="h-3.5 w-3.5" /> Verbunden
                </span>
              )}
              {botStatus.status === "initializing" && (
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Bereitet vor...
                </span>
              )}
              {botStatus.status === "failed" && (
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                  <AlertTriangle className="h-3.5 w-3.5" /> Fehlgeschlagen
                </span>
              )}
              {botStatus.status === "idle" && (
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 bg-slate-800/40 px-2.5 py-1 rounded-full border border-slate-800">
                  Inaktiv
                </span>
              )}
            </div>

            {/* Target Group Info */}
            <div className="border-t border-slate-800 pt-3">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Zielgruppe</div>
              <a 
                href="https://chat.whatsapp.com/Jct87KPblvyDc5PA9m3MH1?mode=gi_t"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mt-1 flex items-center gap-1.5 group break-all"
              >
                <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="underline truncate">Panini WM 2026 Gruppe</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Render QR code or initialize buttons */}
          <div className="mt-6 flex flex-col items-center">
            {botStatus.status === "idle" && (
              <button
                onClick={handleInitBot}
                disabled={isInitializingBot}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-black uppercase py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isInitializingBot ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                WhatsApp Bot starten
              </button>
            )}

            {botStatus.status === "initializing" && botStatus.qrCode && (
              <div className="flex flex-col items-center text-center p-4 bg-slate-950 rounded-2xl border border-slate-800 w-full">
                <p className="text-xs font-bold text-slate-200 mb-3">Scanne diesen QR-Code:</p>
                <div className="bg-white p-3.5 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(botStatus.qrCode)}`}
                    alt="WhatsApp QR Code"
                    className="w-[180px] h-[180px]"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-3 max-w-[220px]">
                  Gehe in WhatsApp auf deinem Handy auf <strong className="text-slate-400">Verknüpfte Geräte</strong> und scanne den Code.
                </p>
              </div>
            )}

            {botStatus.status === "ready" && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/10 text-center w-full">
                <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2 animate-bounce" />
                <h4 className="text-xs font-bold text-emerald-400">Bot ist voll empfangsbereit</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] mx-auto">
                  Der Bot ist der Gruppe beigetreten und wartet auf neue Tausch-Matches!
                </p>
              </div>
            )}

            {botStatus.status === "failed" && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-rose-500/10 text-center w-full space-y-2.5">
                <ShieldAlert className="h-8 w-8 text-rose-400 mx-auto" />
                <div className="text-[11px] text-rose-300 font-bold max-w-[240px] leading-relaxed mx-auto">
                  Da Cloud-Container standardmäßig keine Chromium-Binärdateien installiert haben, läuft der Bot im <span className="text-amber-400 font-black">robusten Simulations-Modus</span>.
                </div>
                <p className="text-[10px] text-slate-500 max-w-[220px] mx-auto">
                  Alle Matches werden vollautomatisch berechnet, lokal geloggt und können direkt in der Liste eingesehen und getestet werden!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info notice about anti-spam block */}
        <div className="text-[10px] text-slate-500 mt-6 pt-4 border-t border-slate-800">
          🔒 <strong className="text-slate-400">Anti-Spam-Sperre:</strong> Jedes Match wird pro Sticker nur ein einziges Mal benachrichtigt, um die WhatsApp-Gruppe vor Spam zu schützen.
        </div>
      </div>

      {/* Matchmaking History Logs */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-black text-sm text-slate-100 uppercase tracking-wider">Live Matchmaker Verlauf</h3>
            <p className="text-[10px] text-slate-400">Letzte Tausch-Matches der Gruppenmitglieder</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={fetchStatusAndLogs}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Aktualisieren"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetLocks}
              disabled={isResetting || logs.length === 0}
              className="text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-rose-500/5 border border-slate-800 hover:border-rose-500/20 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Locks & Logs zurücksetzen"
            >
              <Trash2 className="h-3.5 w-3.5" /> Zurücksetzen
            </button>
          </div>
        </div>

        {/* Logs list */}
        <div className="flex-1 mt-4 overflow-y-auto max-h-[460px] pr-1 space-y-3.5">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500">
              <Clock className="h-10 w-10 text-slate-700 mb-3" />
              <h4 className="font-bold text-xs text-slate-400">Keine Alarme aufgezeichnet</h4>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[280px]">
                Sobald du oder ein anderes Mitglied (z. B. Benny oder Hassan) im Album- oder Import-Reiter neue doppelte Sticker einträgt, die ein anderer benötigt, wird hier ein Tausch-Alarm ausgelöst!
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-800 transition-colors"
              >
                <div className="space-y-2 max-w-xl">
                  {/* Log meta */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-indigo-400 font-bold">
                      {log.userAName} ➔ {log.userBName}
                    </span>
                  </div>

                  {/* Message content */}
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {log.message}
                  </p>

                  {/* Details block */}
                  {log.details && (
                    <p className="text-[9px] text-slate-500 font-normal">
                      ℹ️ {log.details}
                    </p>
                  )}
                </div>

                {/* Status indicator */}
                <div className="shrink-0 flex items-center justify-end">
                  {getStatusBadge(log.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
