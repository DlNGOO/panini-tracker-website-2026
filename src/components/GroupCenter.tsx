import React, { useState, useEffect } from "react";
import { UserProfile, GroupDetails, COUNTRIES } from "../types";
import Avatar from "./Avatar";
import NotificationBotCenter from "./NotificationBotCenter";
import AlbumView from "./AlbumView";
import { 
  Users, Plus, LogIn, Copy, Check, BarChart2, ArrowLeftRight, 
  MessageSquare, AlertCircle, RefreshCw, Send, ShieldAlert, CheckCircle, BookOpen, X 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getStickerName, getCountryFlagUrl } from "../playerData";

interface GroupCenterProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => Promise<void>;
  onExecuteTrade: (
    userAId: string,
    userBId: string,
    userAGives: string[],
    userBGives: string[]
  ) => Promise<void>;
  isLoading: boolean;
}

const AVAILABLE_EMOJIS = ["⚽", "🏆", "🇧🇷", "🇩🇪", "🇦🇷", "🇫🇷", "🦁", "👑", "🌟", "🔥", "⚡", "🦅"];

export default function GroupCenter({ user, onUpdateUser, onExecuteTrade, isLoading }: GroupCenterProps) {
  // Navigation tabs inside the active group
  const [activeSubTab, setActiveSubTab] = useState<"stats" | "trades" | "bot">("stats");
  
  // Album Viewer Modal state
  const [viewingMemberAlbum, setViewingMemberAlbum] = useState<UserProfile | null>(null);

  // Create / Join group states
  const [createName, setCreateName] = useState("");
  const [createAvatar, setCreateAvatar] = useState("⚽");
  const [joinCode, setJoinCode] = useState("");
  
  // Loading & error states
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Group details loaded from API
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState<any[]>([]);

  // Fetch group details if user is in a group
  const fetchGroupDetails = async () => {
    if (!user.groupId) {
      setGroupDetails(null);
      return;
    }
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/groups/${user.groupId}/details`);
      if (res.ok) {
        const data = await res.json();
        setGroupDetails(data);
      } else {
        console.error("Failed to fetch group details");
      }
    } catch (err) {
      console.error("Error fetching group details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Fetch notification logs
  const fetchNotificationLogs = async () => {
    try {
      const res = await fetch("/api/notifications/logs");
      if (res.ok) {
        const data = await res.json();
        setNotificationLogs(data);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
    fetchNotificationLogs();
    
    // Auto refresh logs
    const interval = setInterval(() => {
      fetchNotificationLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, [user.groupId]);

  // Handle group creation
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          avatar: createAvatar,
          userId: user.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Gruppe "${data.group.name}" erfolgreich erstellt!`);
        await onUpdateUser(data.profile);
        setCreateName("");
      } else {
        setErrorMsg(data.error || "Fehler beim Erstellen der Gruppe.");
      }
    } catch (err) {
      setErrorMsg("Verbindungsfehler zum Server.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle group joining
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: joinCode.trim().toUpperCase(),
          userId: user.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Gruppe "${data.group.name}" beigetreten!`);
        await onUpdateUser(data.profile);
        setJoinCode("");
      } else {
        setErrorMsg(data.error || "Falscher Einladungscode.");
      }
    } catch (err) {
      setErrorMsg("Verbindungsfehler zum Server.");
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger bot custom message
  const triggerBotAlert = async (giverName: string, receiverName: string, stickerDisplay: string) => {
    if (!user.groupId) return;
    setActionLoading(true);
    try {
      // Create message exactly as requested
      const messageText = `Tausch-Alarm! 🚨 ${giverName} hat den Sticker ${stickerDisplay} doppelt. ${receiverName} sucht diesen Sticker noch. Zeit für einen Tausch! ⚽️`;
      const res = await fetch(`/api/groups/${user.groupId}/bot-trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText })
      });
      if (res.ok) {
        setSuccessMsg("E-Mail-Gruppenbenachrichtigung wurde gesendet!");
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchNotificationLogs();
      } else {
        setErrorMsg("Fehler beim Senden der Benachrichtigung.");
      }
    } catch (err) {
      setErrorMsg("Konnte Bot-Benachrichtigung nicht versenden.");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute trade from group trade view
  const handleGroupTradeExecute = async (
    userAId: string,
    userBId: string,
    userAGives: string[],
    userBGives: string[],
    nameA: string,
    nameB: string
  ) => {
    try {
      await onExecuteTrade(userAId, userBId, userAGives, userBGives);
      setSuccessMsg(`Tausch zwischen ${nameA} and ${nameB} wurde erfolgreich durchgeführt!`);
      setTimeout(() => setSuccessMsg(null), 5000);
      await fetchGroupDetails();
    } catch (err) {
      console.error("Trade failed:", err);
    }
  };

  const getPublicInviteLink = (inviteCode: string) => {
    let origin = window.location.origin;
    if (origin.includes("ais-dev-")) {
      origin = origin.replace("ais-dev-", "ais-pre-");
    }
    return `${origin}?invite=${inviteCode}`;
  };

  const copyInviteLink = () => {
    if (!groupDetails) return;
    const inviteLink = getPublicInviteLink(groupDetails.group.inviteCode);
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCountryFlagAndName = (code: string) => {
    const countryPart = code.substring(0, 3).toUpperCase();
    const c = COUNTRIES[countryPart];
    return {
      flag: c ? c.flag : "🏳️",
      name: c ? c.name : countryPart,
    };
  };

  // Rendering NO GROUP STATE
  if (!user.groupId) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-4" id="no-group-container">
        {/* Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
          <Users className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-100">Gruppen & Tausch-Center</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            Erstelle eine Gruppe, lade Freunde ein und sammelt eure WM 2026 Sticker gemeinsam! Der integrierte E-Mail-Bot sendet automatische Tauschanfragen, wenn jemand doppelte Sticker hat, die anderen fehlen.
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Group Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl">
                  <Plus className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-100">Neue Gruppe erstellen</h2>
              </div>
              <p className="text-slate-400 text-xs mb-6">
                Benenne deine Gruppe, wähle ein Symbol und generiere einen exklusiven Einladungslink für deine Sticker-Freunde.
              </p>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Gruppenname</label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. WM Tausch-Elite ⚽"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Gruppen-Symbol (Emoji)</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCreateAvatar(emoji)}
                        className={`text-xl p-2.5 rounded-xl border transition-all ${
                          createAvatar === emoji 
                            ? "bg-indigo-500/20 border-indigo-500 scale-110 shadow-md" 
                            : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Gruppe jetzt erstellen</span>
                </button>
              </form>
            </div>
          </div>

          {/* Join Group Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl">
                  <LogIn className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-100">Einer Gruppe beitreten</h2>
              </div>
              <p className="text-slate-400 text-xs mb-6">
                Hast du einen Einladungscode oder Einladungslink von einem Freund erhalten? Gib den 6-stelligen Code hier ein.
              </p>

              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Einladungscode</label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. AX8F5P"
                    maxLength={10}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-center font-mono font-bold text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>

                <div className="text-center text-xs text-slate-500 pt-2">
                  Sobald du beigetreten bist, werden deine Sticker für die automatische Tauschbörse analysiert!
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !joinCode.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
                >
                  {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  <span>Gruppe beitreten</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendering loading state for details
  if (detailsLoading && !groupDetails) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center flex flex-col items-center justify-center">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Lade Gruppen-Daten...</p>
      </div>
    );
  }

  // Fallback if details couldn't load but group ID exists
  if (!groupDetails) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-300 text-lg">Fehler beim Laden</h3>
        <button 
          onClick={fetchGroupDetails}
          className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2 rounded-lg transition-all"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  const { group, members, matches, botAnalysis } = groupDetails;
  const isCreator = group.createdBy === user.id;

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2" id="active-group-container">
      {/* Group Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl md:text-5xl bg-slate-950 p-4 rounded-2xl border border-slate-800 select-none shadow-inner">
              {group.avatar}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-100">{group.name}</h1>
              <p className="text-slate-400 text-xs mt-1 flex items-center gap-2">
                <span>Einladungscode:</span>
                <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-bold text-indigo-400 tracking-wider">
                  {group.inviteCode}
                </span>
                <span>•</span>
                <span>{members.length} Mitglieder</span>
              </p>
            </div>
          </div>

          {/* Invitation Copy Box */}
          <div className="flex flex-col gap-2 w-full md:w-auto max-w-sm">
            <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-3">
              <div className="overflow-hidden min-w-[180px]">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Spieler einladen (Link)</div>
                <div className="text-slate-300 text-xs truncate font-mono mt-0.5 select-all">
                  {getPublicInviteLink(group.inviteCode)}
                </div>
              </div>
              <button
                onClick={copyInviteLink}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  copied 
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
                title="Einladungslink kopieren"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="text-[11px] text-slate-400 leading-normal px-1 bg-indigo-950/20 p-2 rounded-lg border border-indigo-900/30">
              💡 <strong className="text-indigo-300">Tipp gegen 403-Fehler:</strong> Der Einladungslink wurde automatisch für Gastspieler angepasst (<code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">ais-pre-</code>). Verwende immer diesen Link, damit Deine Freunde der Gruppe ohne Berechtigungsprobleme beitreten können!
            </div>
          </div>
        </div>
      </div>

      {/* Action alerts */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Group Navigation Bar */}
      <div className="flex overflow-x-auto border-b border-slate-800/80 no-scrollbar">
        <button
          onClick={() => setActiveSubTab("stats")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === "stats"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          <span>Gruppen-Statistiken</span>
        </button>
        <button
          onClick={() => setActiveSubTab("trades")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === "trades"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          <span>Tauschbörse</span>
          {matches.length > 0 && (
            <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {matches.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("bot")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            activeSubTab === "bot"
              ? "border-indigo-500 text-indigo-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Gruppen-Bot 🤖</span>
          {botAnalysis.length > 0 && (
            <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {botAnalysis.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {/* TAB 1: GROUP STATS */}
        {activeSubTab === "stats" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-indigo-400" />
              <span>Sammelfortschritt aller Gruppenmitglieder</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Spieler</th>
                    <th className="py-3 px-4">Fortschritt</th>
                    <th className="py-3 px-4 text-center">Einzigartig</th>
                    <th className="py-3 px-4 text-center">Doppelt</th>
                    <th className="py-3 px-4 text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {members.map((member) => {
                    const totalStickers = 980; // 48 countries * 20 + 20 FWC
                    const uniqueCount = member.owned ? member.owned.length : 0;
                    const completionPercent = Math.min(
                      Math.round((uniqueCount / totalStickers) * 100),
                      100
                    );
                    
                    const dupCount = Object.values(member.duplicates || {}).reduce(
                      (acc: number, val: any) => acc + (val > 0 ? val : 0),
                      0
                    );

                    return (
                      <tr key={member.id} className="text-slate-300 text-sm hover:bg-slate-950/40 transition-colors">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <Avatar avatar={member.avatar} className="text-xl" />
                          <div>
                            <div className="font-bold text-slate-200 flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {member.id === user.id && (
                                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/20">
                                  Du
                                </span>
                              )}
                              {member.id === group.createdBy && (
                                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">{member.email || "Keine E-Mail"}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 min-w-[180px]">
                          <div className="flex items-center gap-3">
                            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${completionPercent}%` }}
                              ></div>
                            </div>
                            <span className="font-bold font-mono text-slate-200 text-xs shrink-0">{completionPercent}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono text-indigo-400">
                          {uniqueCount} <span className="text-xs text-slate-600">/ {totalStickers}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono text-amber-400">
                          {dupCount}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setViewingMemberAlbum(member)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ml-auto"
                          >
                            <BookOpen className="h-3 w-3" />
                            Album anzeigen
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: GROUP TRADES */}
        {activeSubTab === "trades" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-indigo-400" />
                <span>Gruppen Tausch-Analyse</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Dieser Tausch-Algorithmus sucht nach passenden Doppelten zwischen den Mitgliedern dieser Gruppe. "Perfect Matches" bedeuten, dass beide Spieler gegenseitig Sticker tauschen können, die ihnen fehlen!
              </p>
            </div>

            {matches.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <AlertCircle className="h-10 w-10 text-slate-500 mb-3" />
                <h3 className="font-bold text-slate-300 text-lg">Keine Tauschvorschläge</h3>
                <p className="text-slate-500 text-xs max-w-md mt-1 mx-auto">
                  Aktuell gibt es keine passenden Überschneidungen in deiner Gruppe. Lade mehr Freunde in deine Gruppe ein, trage mehr doppelte Sticker in dein Album ein oder importiere sie über den E-Mail KI-Import!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((trade) => {
                  const isPerfect = trade.type === "perfect";
                  return (
                    <div
                      key={trade.id}
                      className={`bg-slate-900 border rounded-2xl p-5 transition-all duration-300 ${
                        isPerfect ? "border-indigo-500/50 shadow-[0_4px_20px_rgba(99,102,241,0.05)]" : "border-slate-800"
                      }`}
                    >
                      {/* Top bar */}
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          {isPerfect ? (
                            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ArrowLeftRight className="h-3 w-3" /> Perfect Match
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Einseitig
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {trade.userAGives.length + trade.userBGives.length} Tauschbare Sticker
                        </div>
                      </div>

                      {/* Members Comparison Panel */}
                      <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4">
                        {/* User A details */}
                        <div className="md:col-span-3 bg-slate-950 p-4 rounded-xl border border-slate-800/60 min-h-[120px] flex flex-col justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar avatar={trade.userA.avatar} className="text-xl" />
                            <span className="font-bold text-slate-200 text-sm">{trade.userA.name}</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Bietet an ({trade.userAGives.length}):</div>
                            {trade.userAGives.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                                {trade.userAGives.map((code) => {
                                  const info = getCountryFlagAndName(code);
                                  return (
                                    <span key={code} className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-300 px-1 py-0.5 rounded" title={getStickerName(code)}>
                                      <span>{info.flag}</span>
                                      <span>{code}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-slate-600 italic text-[11px]">Nichts passendes</div>
                            )}
                          </div>
                        </div>

                        {/* Mid Indicator */}
                        <div className="md:col-span-1 flex flex-col items-center justify-center">
                          <div className="bg-slate-950 p-2.5 rounded-full border border-slate-800 text-indigo-400 shadow-inner">
                            <ArrowLeftRight className="h-4 w-4" />
                          </div>
                        </div>

                        {/* User B details */}
                        <div className="md:col-span-3 bg-slate-950 p-4 rounded-xl border border-slate-800/60 min-h-[120px] flex flex-col justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar avatar={trade.userB.avatar} className="text-xl" />
                            <span className="font-bold text-slate-200 text-sm">{trade.userB.name}</span>
                          </div>
                          <div className="mt-2">
                            <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Bietet an ({trade.userBGives.length}):</div>
                            {trade.userBGives.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                                {trade.userBGives.map((code) => {
                                  const info = getCountryFlagAndName(code);
                                  return (
                                    <span key={code} className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-300 px-1 py-0.5 rounded" title={getStickerName(code)}>
                                      <span>{info.flag}</span>
                                      <span>{code}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-slate-600 italic text-[11px]">Nichts passendes</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Execute Button */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleGroupTradeExecute(
                            trade.userA.id,
                            trade.userB.id,
                            trade.userAGives,
                            trade.userBGives,
                            trade.userA.name,
                            trade.userB.name
                          )}
                          disabled={isLoading}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 font-semibold text-xs text-white px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" /> Tausche...
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" /> Tausch jetzt durchführen
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GROUP BOT */}
        {activeSubTab === "bot" && (
          <NotificationBotCenter />
        )}
      </div>

      {/* Album Viewer Modal */}
      <AnimatePresence>
        {viewingMemberAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm"
          >
            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Avatar avatar={viewingMemberAlbum.avatar} className="text-2xl" />
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Album von {viewingMemberAlbum.name}</h2>
                  <p className="text-xs text-slate-400">Schreibgeschützter Ansichtsmodus</p>
                </div>
              </div>
              <button
                onClick={() => setViewingMemberAlbum(null)}
                className="bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 p-2 rounded-xl transition-colors border border-transparent hover:border-rose-500/30"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <AlbumView
                profile={viewingMemberAlbum}
                onUpdateInventory={() => {}}
                readonly={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
