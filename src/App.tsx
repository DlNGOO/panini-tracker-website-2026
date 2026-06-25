import React, { useState, useEffect } from "react";
import { UserProfile } from "./types";
import AlbumView from "./components/AlbumView";
import TradeCenter from "./components/TradeCenter";
import StatsDashboard from "./components/StatsDashboard";
import NationsProgressTable from "./components/NationsProgressTable";
import NotificationTray from "./components/NotificationTray";
import NotificationBotCenter from "./components/NotificationBotCenter";
import LoginScreen from "./components/LoginScreen";
import ProfileView from "./components/ProfileView";
import Avatar from "./components/Avatar";
import GroupCenter from "./components/GroupCenter";
import {
  BookOpen,
  ArrowLeftRight,
  Sparkles,
  BarChart3,
  RefreshCw,
  Users,
  Database,
  Trash2,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Table,
  MessageSquare,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    const RESET_VERSION = "panini_reset_v4";
    if (!localStorage.getItem(RESET_VERSION)) {
      // Clear all panini keys to force logout and clear sticker cache
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("panini_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(RESET_VERSION, "true");
      return "";
    }
    const loggedInId = localStorage.getItem("panini_logged_in_user_id") || "";
    return loggedInId === "undefined" ? "" : loggedInId;
  });
  const [activeTab, setActiveTab] = useState<"album" | "nations" | "group" | "profile">("album");
  const [selectedCountryKey, setSelectedCountryKey] = useState<string>("GER");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    // Parse invite code from URL parameters
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get("invite");
    if (inviteCode) {
      localStorage.setItem("panini_pending_invite", inviteCode.toUpperCase());
      // Clean URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      triggerSuccessToast(`Einladungscode ${inviteCode.toUpperCase()} erkannt! Bitte anmelden/registrieren.`);
    }
  }, []);

  // Fetch profiles on load
  const fetchProfiles = async () => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      const response = await fetch("/api/profiles");
      if (!response.ok) {
        throw new Error("Fehler beim Laden der Gruppen-Profile.");
      }
      const data: UserProfile[] = await response.json();
      
      // Update localStorage with the latest server data
      const updatedData = data.map((profile) => {
        localStorage.setItem(`panini_owned_${profile.id}`, JSON.stringify(profile.owned || []));
        localStorage.setItem(`panini_duplicates_${profile.id}`, JSON.stringify(profile.duplicates || {}));
        return profile;
      });


      // Select the first user if current selection is not found, but only if they were logged in
      let verifiedUserId = selectedUserId;
      if (selectedUserId && selectedUserId !== "undefined" && !updatedData.some((p: UserProfile) => p.id === selectedUserId)) {
        if (updatedData.length > 0) {
          verifiedUserId = updatedData[0].id;
          setSelectedUserId(verifiedUserId);
          localStorage.setItem("panini_logged_in_user_id", verifiedUserId);
        } else {
          verifiedUserId = "";
          setSelectedUserId("");
          localStorage.removeItem("panini_logged_in_user_id");
        }
      }

      // Auto-join pending invite if we have a valid logged-in user
      if (verifiedUserId) {
        const pendingInvite = localStorage.getItem("panini_pending_invite");
        if (pendingInvite) {
          try {
            console.log(`Auto-joining group with invite ${pendingInvite} for user ${verifiedUserId}`);
            const joinRes = await fetch("/api/groups/join", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ inviteCode: pendingInvite, userId: verifiedUserId })
            });
            const joinData = await joinRes.json();
            if (joinRes.ok && joinData.success) {
              localStorage.removeItem("panini_pending_invite");
              
              // Update local profile data immediately to reflect the new group
              const finalData = updatedData.map(p => 
                p.id === verifiedUserId ? { ...p, groupId: joinData.group.id } : p
              );
              setProfiles(finalData);
              setActiveTab("group");
              triggerSuccessToast(`Erfolgreich über Einladungslink der Gruppe "${joinData.group.name}" beigetreten!`);
              return; // skip the normal setProfiles since we did it above
            }
          } catch (e) {
            console.error("Failed to auto-join pending group invite on load:", e);
          }
        }
      }

      setProfiles(updatedData);
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Verbindung zum Server fehlgeschlagen.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const activeProfile = profiles.find((p) => p.id === selectedUserId);

  // Update selected user's inventory
  const handleUpdateInventory = async (owned: string[], duplicates: Record<string, number>) => {
    if (!activeProfile) return;
    
    // Save to local backup first
    localStorage.setItem(`panini_owned_${activeProfile.id}`, JSON.stringify(owned));
    localStorage.setItem(`panini_duplicates_${activeProfile.id}`, JSON.stringify(duplicates));

    // Optimistically update local UI state immediately (no waiting for server)
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfile.id
          ? { ...p, owned, duplicates }
          : p
      )
    );

    try {
      const response = await fetch(`/api/profiles/${activeProfile.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owned, duplicates }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Aktualisieren des Albums.");
      }

      const updated = await response.json();
      
      // Update localStorage to match server canonical response to prevent sync loop
      localStorage.setItem(`panini_owned_${activeProfile.id}`, JSON.stringify(updated.owned || []));
      localStorage.setItem(`panini_duplicates_${activeProfile.id}`, JSON.stringify(updated.duplicates || {}));
      
      // Update local state with canonical server response
      setProfiles((prev) =>
        prev.map((p) => (p.id === activeProfile.id ? updated : p))
      );
      
      // No success toast here — it was causing render loops and is too noisy for frequent sticker clicks
    } catch (err: any) {
      console.error(err);
      setGlobalError("Sticker-Aktualisierung fehlgeschlagen.");
    }
  };

  // Helper to execute trade
  const handleExecuteTrade = async (
    userAId: string,
    userBId: string,
    userAGives: string[],
    userBGives: string[]
  ) => {
    setIsLoading(true);
    try {
      const uA = profiles.find((p) => p.id === userAId);
      const uB = profiles.find((p) => p.id === userBId);
      if (!uA || !uB) throw new Error("Benutzer nicht gefunden");

      // Calculate A's new state
      const nextOwnedA = [...uA.owned];
      const nextDuplicatesA = { ...uA.duplicates };
      
      // A gives away duplicates
      for (const code of userAGives) {
        const val = nextDuplicatesA[code] || 1;
        if (val <= 1) delete nextDuplicatesA[code];
        else nextDuplicatesA[code] = val - 1;
      }
      // A receives stickers
      for (const code of userBGives) {
        if (!nextOwnedA.includes(code)) nextOwnedA.push(code);
      }

      // Calculate B's new state
      const nextOwnedB = [...uB.owned];
      const nextDuplicatesB = { ...uB.duplicates };
      
      // B gives away duplicates
      for (const code of userBGives) {
        const val = nextDuplicatesB[code] || 1;
        if (val <= 1) delete nextDuplicatesB[code];
        else nextDuplicatesB[code] = val - 1;
      }
      // B receives stickers
      for (const code of userAGives) {
        if (!nextOwnedB.includes(code)) nextOwnedB.push(code);
      }

      // Backup local storage immediately
      localStorage.setItem(`panini_owned_${userAId}`, JSON.stringify(nextOwnedA));
      localStorage.setItem(`panini_duplicates_${userAId}`, JSON.stringify(nextDuplicatesA));
      localStorage.setItem(`panini_owned_${userBId}`, JSON.stringify(nextOwnedB));
      localStorage.setItem(`panini_duplicates_${userBId}`, JSON.stringify(nextDuplicatesB));

      // Send update requests sequentially
      const resA = await fetch(`/api/profiles/${userAId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owned: nextOwnedA, duplicates: nextDuplicatesA }),
      });
      const resB = await fetch(`/api/profiles/${userBId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owned: nextOwnedB, duplicates: nextDuplicatesB }),
      });

      if (!resA.ok || !resB.ok) {
        throw new Error("Tausch konnte auf dem Server nicht gespeichert werden.");
      }

      // Reload
      await fetchProfiles();
      triggerSuccessToast("Tausch erfolgreich durchgeführt!");
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Tausch-Fehler.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new profile
  const handleAddProfile = async (name: string, avatar: string) => {
    setIsLoading(true);
    const id = name.toLowerCase().replace(/\s+/g, "-");
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar, owned: [], duplicates: {} }),
      });
      if (!response.ok) throw new Error("Fehler beim Erstellen.");
      await fetchProfiles();
      triggerSuccessToast(`Sammler ${name} hinzugefügt!`);
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Login Handler
  const handleLogin = async (name: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedUserId(data.profile.id);
        localStorage.setItem("panini_logged_in_user_id", data.profile.id);
        
        // Handle pending invite code join
        const pendingInvite = localStorage.getItem("panini_pending_invite");
        if (pendingInvite) {
          try {
            const joinRes = await fetch("/api/groups/join", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ inviteCode: pendingInvite, userId: data.profile.id })
            });
            const joinData = await joinRes.json();
            if (joinRes.ok && joinData.success) {
              localStorage.removeItem("panini_pending_invite");
              setActiveTab("group");
              triggerSuccessToast(`Erfolgreich Gruppe "${joinData.group.name}" beigetreten!`);
            }
          } catch (e) {
            console.error("Failed to join pending group invite on login:", e);
          }
        }

        await fetchProfiles();
        triggerSuccessToast(`Willkommen zurück, ${data.profile.name}!`);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up a brand new user
  const handleSignUp = async (name: string, email: string, phoneNumber: string, avatar: string, password: string) => {
    setIsLoading(true);
    try {
      const pendingInvite = localStorage.getItem("panini_pending_invite") || null;
      
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          avatar, 
          email,
          phoneNumber,
          password,
          notifyPreference: "both",
          groupId: null
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Fehler beim Erstellen des Profils.");
      
      const userId = data.profile.id;
      
      // Save backups locally
      localStorage.setItem(`panini_owned_${userId}`, JSON.stringify([]));
      localStorage.setItem(`panini_duplicates_${userId}`, JSON.stringify({}));
      
      setSelectedUserId(userId);
      localStorage.setItem("panini_logged_in_user_id", userId);

      // Join pending group if invite exists
      if (pendingInvite) {
        try {
          const joinRes = await fetch("/api/groups/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inviteCode: pendingInvite, userId })
          });
          const joinData = await joinRes.json();
          if (joinRes.ok && joinData.success) {
            localStorage.removeItem("panini_pending_invite");
            setActiveTab("group");
            triggerSuccessToast(`Konto erstellt und Gruppe "${joinData.group.name}" beigetreten!`);
          }
        } catch (e) {
          console.error("Failed to join pending group invite on signup:", e);
        }
      } else {
        triggerSuccessToast(`Willkommen ${name}! Account erfolgreich erstellt.`);
      }

      await fetchProfiles();
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a user's details
  const handleUpdateProfile = async (updatedFields: Partial<UserProfile>) => {
    if (!activeProfile) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profiles/${activeProfile.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...activeProfile,
          ...updatedFields,
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Aktualisieren des Profils.");
      }

      const updated = await response.json();
      
      // Update state
      setProfiles((prev) =>
        prev.map((p) => (p.id === activeProfile.id ? updated : p))
      );
      
      triggerSuccessToast("Profil erfolgreich aktualisiert!");
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout current user
  const handleLogout = () => {
    setSelectedUserId("");
    localStorage.removeItem("panini_logged_in_user_id");
    setActiveTab("album");
  };

  // Delete profile
  const handleDeleteProfile = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Löschen fehlgeschlagen.");
      await fetchProfiles();
      triggerSuccessToast("Profil erfolgreich gelöscht.");
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset database to initial chat data
  const handleResetDatabase = async () => {
    setIsLoading(true);
    try {
      // Clear localStorage backups
      profiles.forEach((p) => {
        localStorage.removeItem(`panini_owned_${p.id}`);
        localStorage.removeItem(`panini_duplicates_${p.id}`);
      });

      const response = await fetch("/api/reset", { method: "POST" });
      if (!response.ok) throw new Error("Reset fehlgeschlagen.");
      const data = await response.json();
      setProfiles(data);
      setShowResetConfirm(false);
      triggerSuccessToast("Datenbank auf E-Mail-Ausgangszustand zurückgesetzt!");
    } catch (err: any) {
      console.error(err);
      setGlobalError("Reset-Fehler.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSuccessToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Compute total collection stats
  const TOTAL_STICKERS = 980;
  const totalGroupOwnedUnique = new Set(profiles.flatMap((p) => p.owned || [])).size;
  const totalGroupOwnedUniquePct = ((totalGroupOwnedUnique / TOTAL_STICKERS) * 100).toFixed(1);

  if (!selectedUserId || selectedUserId === "undefined") {
    return (
      <LoginScreen
        profiles={profiles}
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" id="app-root">
      {/* Background Image */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30 z-0" 
        style={{ 
          backgroundImage: "url('/background.jpg')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat'
        }} 
      />

      {/* Global Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/30 text-emerald-400 text-sm px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5"
          >
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header navigation */}
      <header className="relative border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <span className="text-3xl bg-gradient-to-tr from-indigo-500 to-indigo-700 p-2.5 rounded-xl border border-indigo-500/20 shadow-inner text-white">
              ⚽
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
                  PANINI WM 2026
                </h1>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold px-1.5 rounded uppercase tracking-wider">
                  Gruppe Chat
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono tracking-wide mt-0.5">Sticker-Manager • E-Mail Inside Edition</p>
            </div>
          </div>

          {/* Group General Stats Banner */}
          <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl text-xs font-mono">
            <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-slate-400 font-bold">Gruppen-Vollständigkeit</div>
              <div className="text-slate-300 font-bold mt-0.5">
                {totalGroupOwnedUnique} / {TOTAL_STICKERS} Sticker ({totalGroupOwnedUniquePct}%)
              </div>
            </div>
          </div>

          {/* Core Settings triggers */}
          <div className="flex items-center gap-2">
            <NotificationTray
              profiles={profiles}
              onExecuteTrade={handleExecuteTrade}
              isLoading={isLoading}
              activeUserId={selectedUserId}
            />
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-xs font-mono font-bold text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 cursor-pointer h-[38px]"
              title="Datenbank zurücksetzen"
            >
              <Database className="h-3.5 w-3.5" /> DB Reset
            </button>
          </div>
        </div>
      </header>

      {/* Database Reset Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
                <Database className="h-5 w-5 text-rose-500" /> Datenbank zurücksetzen?
              </h3>
              <p className="text-slate-400 text-sm mt-2">
                Möchtest du alle Sticker-Änderungen verwerfen und die Datenbank auf den Originalzustand zurücksetzen, wie er im E-Mail-Chat von Hassan & Benny dokumentiert ist?
              </p>
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleResetDatabase}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Ja, zurücksetzen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        
        {/* Logged-in active collector card banner */}
        {activeProfile && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar avatar={activeProfile.avatar} className="text-3xl bg-slate-950 border border-slate-850 p-2 rounded-xl" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">{activeProfile.name}</span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                    Eingeloggt
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1 font-medium">
                  {activeProfile.email && (
                    <span className="flex items-center gap-1">📧 {activeProfile.email}</span>
                  )}
                  {activeProfile.phoneNumber && (
                    <span className="flex items-center gap-1">📱 {activeProfile.phoneNumber}</span>
                  )}
                  <span className="flex items-center gap-1">🔔 Alarm-Kanal: <span className="text-indigo-400 font-bold uppercase text-[9px]">{activeProfile.notifyPreference || "Beide"}</span></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <span className="font-bold font-mono text-xs text-slate-300">
                  {activeProfile.owned.length} / {TOTAL_STICKERS} Sticker gesammelt
                </span>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {((activeProfile.owned.length / TOTAL_STICKERS) * 100).toFixed(1)}% Album-Fortschritt
                </div>
              </div>

              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === "profile"
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800"
                }`}
              >
                <User className="h-3.5 w-3.5" /> Profil & Alarme
              </button>
            </div>
          </div>
        )}

        {/* Global Loading / Error indicators */}
        {globalError && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex justify-between items-center text-rose-400 text-sm">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <span>{globalError}</span>
            </div>
            <button
              onClick={fetchProfiles}
              className="font-bold text-xs font-mono uppercase text-indigo-400 hover:text-indigo-300"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Tab Selection Navigation bar */}
        <div className="flex border-b border-slate-900 pb-0.5 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab("album")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "album"
                ? "border-indigo-500 bg-indigo-950/15 text-indigo-300"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
            }`}
          >
            <BookOpen className="h-4 w-4" /> Mein Album
          </button>
          <button
            onClick={() => setActiveTab("nations")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "nations"
                ? "border-indigo-500 bg-indigo-950/15 text-indigo-300"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
            }`}
          >
            <Table className="h-4 w-4" /> Nationen-Tracker
          </button>
          <button
            onClick={() => setActiveTab("group")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "group"
                ? "border-indigo-500 bg-indigo-950/15 text-indigo-300"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
            }`}
          >
            <Users className="h-4 w-4" /> Gruppe
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "profile"
                ? "border-indigo-500 bg-indigo-950/15 text-indigo-300"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
            }`}
          >
            <User className="h-4 w-4 text-indigo-400" /> Mein Profil
          </button>
        </div>

        {/* Tab View Display */}
        {isLoading && profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-sm gap-3">
            <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
            <div>Lade Panini Sticker-Datenbank...</div>
          </div>
        ) : (
          <div className="mt-2">
            {activeTab === "album" && activeProfile && (
              <AlbumView
                profile={activeProfile}
                onUpdateInventory={handleUpdateInventory}
                selectedCountryKey={selectedCountryKey}
                setSelectedCountryKey={setSelectedCountryKey}
              />
            )}
            {activeTab === "nations" && activeProfile && (
              <NationsProgressTable
                profile={activeProfile}
                onSelectCountry={(key) => {
                  setSelectedCountryKey(key);
                  setActiveTab("album");
                }}
              />
            )}
            {activeTab === "group" && activeProfile && (
              <GroupCenter
                user={activeProfile}
                onUpdateUser={async (updatedUser) => {
                  setProfiles((prev) =>
                    prev.map((p) => (p.id === updatedUser.id ? updatedUser : p))
                  );
                }}
                onExecuteTrade={handleExecuteTrade}
                isLoading={isLoading}
              />
            )}
            {activeTab === "profile" && activeProfile && (
              <ProfileView
                profile={activeProfile}
                onUpdateProfile={handleUpdateProfile}
                onLogout={handleLogout}
                isLoading={isLoading}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer credits and information */}
      <footer className="border-t border-slate-900 mt-16 bg-slate-950 py-8 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-500">Panini WM 2026 Sticker-Manager</span> • Entwickelt für Benny, Hassan, Jonas & Oliver
          </div>
          <div className="flex gap-4">
            <span>⚽ Ein Stück Kindheit</span>
            <span>🧱 Lego-Investments rules</span>
            <span>🐐 Messi ist eingeklebt</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
