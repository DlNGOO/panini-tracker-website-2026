import React, { useState, useRef, useEffect } from "react";
import { UserProfile, COUNTRIES } from "../types";
import Avatar from "./Avatar";
import { Bell, BellRing, X, Check, ArrowRight, Gift, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NotificationTrayProps {
  profiles: UserProfile[];
  onExecuteTrade: (
    userAId: string,
    userBId: string,
    userAGives: string[],
    userBGives: string[]
  ) => Promise<void>;
  isLoading: boolean;
  activeUserId: string;
}

interface TradeSuggestion {
  id: string;
  userA: UserProfile;
  userB: UserProfile;
  userAGives: string[];
  userBGives: string[];
  type: "perfect" | "one-way-A" | "one-way-B";
  score: number; // calculated priority score
}

export default function NotificationTray({
  profiles,
  onExecuteTrade,
  isLoading,
  activeUserId,
}: NotificationTrayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const trayRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (trayRef.current && !trayRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to format sticker info
  const getStickerInfo = (code: string) => {
    const countryKey = code.substring(0, 3).toUpperCase();
    const country = COUNTRIES[countryKey];
    return {
      flag: country ? country.flag : "🏳️",
      name: country ? country.name : countryKey,
      num: code.substring(3),
    };
  };

  // Generate smart trade recommendations
  const getSuggestions = (): TradeSuggestion[] => {
    const suggestions: TradeSuggestion[] = [];
    
    // We only suggest trades involving at least one person, and particularly prioritize the active user if possible
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const uA = profiles[i];
        const uB = profiles[j];

        const dupA = Object.keys(uA.duplicates || {}).filter((code) => (uA.duplicates?.[code] || 0) > 0);
        const dupB = Object.keys(uB.duplicates || {}).filter((code) => (uB.duplicates?.[code] || 0) > 0);

        const uBOwned = uB.owned || [];
        const uAOwned = uA.owned || [];

        // A gives to B: A has duplicate, B does not own it
        const uAGives = dupA.filter((code) => !uBOwned.includes(code));
        // B gives to A: B has duplicate, A does not own it
        const uBGives = dupB.filter((code) => !uAOwned.includes(code));

        if (uAGives.length > 0 || uBGives.length > 0) {
          let type: "perfect" | "one-way-A" | "one-way-B" = "perfect";
          let score = 0;

          if (uAGives.length > 0 && uBGives.length > 0) {
            type = "perfect";
            score = uAGives.length + uBGives.length + 10; // High priority for mutual trades
          } else if (uAGives.length > 0) {
            type = "one-way-A";
            score = uAGives.length + 2;
          } else {
            type = "one-way-B";
            score = uBGives.length + 2;
          }

          // Prioritize suggestions that involve the active logged-in user
          if (uA.id === activeUserId || uB.id === activeUserId) {
            score += 5;
          }

          suggestions.push({
            id: `suggestion-${uA.id}-${uB.id}`,
            userA: uA,
            userB: uB,
            userAGives: uAGives.slice(0, 3), // suggest up to 3 stickers at a time for layout sanity
            userBGives: uBGives.slice(0, 3),
            type,
            score,
          });
        }
      }
    }

    // Sort by score (descending) and exclude dismissed ones
    return suggestions
      .sort((a, b) => b.score - a.score)
      .filter((s) => !dismissedIds.includes(s.id));
  };

  const suggestions = getSuggestions();
  const notificationCount = suggestions.length;

  const handleExecute = async (s: TradeSuggestion) => {
    try {
      await onExecuteTrade(s.userA.id, s.userB.id, s.userAGives, s.userBGives);
      // Automatically dismiss this recommendation after execution
      setDismissedIds((prev) => [...prev, s.id]);
    } catch (err) {
      console.error("Failed to execute trade from notification:", err);
    }
  };

  const dismissSuggestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <div className="relative" ref={trayRef} id="notification-tray-root">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? "bg-indigo-950/50 border-indigo-500 text-indigo-300"
            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
        }`}
        title="Tauschempfehlungen & Benachrichtigungen"
      >
        {notificationCount > 0 ? (
          <>
            <BellRing className="h-5 w-5 text-indigo-400 animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-mono text-[9px] font-black h-5 w-5 rounded-full flex items-center justify-center border border-slate-950 animate-bounce">
              {notificationCount}
            </span>
          </>
        ) : (
          <Bell className="h-5 w-5" />
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-[360px] sm:w-[420px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  KI-Tauschempfehlungen ({notificationCount})
                </span>
              </div>
              {notificationCount > 0 && (
                <span className="text-[10px] bg-indigo-900/50 text-indigo-300 border border-indigo-800/40 px-2 py-0.5 rounded-full font-bold">
                  Intelligenter Abgleich
                </span>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/50">
              {suggestions.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2.5">
                  <div className="bg-slate-950 p-3 rounded-full border border-slate-800/50">
                    <Check className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-300">Alles aktuell!</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-[240px]">
                      Keine ausstehenden Tauschempfehlungen. Sobald jemand neue doppelte Sticker einträgt, berechnen wir die optimalen Tausche!
                    </p>
                  </div>
                </div>
              ) : (
                suggestions.map((s) => {
                  const isPerfect = s.type === "perfect";
                  
                  return (
                    <div
                      key={s.id}
                      className={`p-4 hover:bg-slate-800/20 transition-colors flex flex-col gap-3 relative group`}
                    >
                      {/* Top labels */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isPerfect ? (
                            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5" /> Tausch-Vorschlag
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Gift className="h-2.5 w-2.5" /> Schenkung
                            </span>
                          )}
                        </div>
                        
                        {/* Dismiss button */}
                        <button
                          onClick={(e) => dismissSuggestion(s.id, e)}
                          className="p-1 rounded-md text-slate-600 hover:text-rose-400 hover:bg-slate-950 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Vorschlag verwerfen"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Main comparison representation */}
                      <div className="flex items-center gap-3">
                        {/* User A */}
                        <div className="flex-1 bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl flex items-center gap-2.5">
                          <Avatar avatar={s.userA.avatar} className="text-xl shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate">{s.userA.name}</div>
                            <div className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">
                              {s.userAGives.length > 0 
                                ? `Gibt: ${s.userAGives.join(", ")}` 
                                : "Erhält nur"
                              }
                            </div>
                          </div>
                        </div>

                        {/* Middle Arrow */}
                        <div className="shrink-0 text-slate-600 flex items-center justify-center">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>

                        {/* User B */}
                        <div className="flex-1 bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl flex items-center gap-2.5">
                          <Avatar avatar={s.userB.avatar} className="text-xl shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate">{s.userB.name}</div>
                            <div className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">
                              {s.userBGives.length > 0 
                                ? `Gibt: ${s.userBGives.join(", ")}` 
                                : "Erhält nur"
                              }
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Explicit breakdown & CTA button */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850/60 flex items-center justify-between gap-4">
                        <div className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[210px]">
                          {isPerfect ? (
                            <span>
                              Beide bekommen fehlende Sticker! Ein perfektes Match für eure Sammlung.
                            </span>
                          ) : s.type === "one-way-A" ? (
                            <span>
                              <strong>{s.userA.name}</strong> hat doppelte Sticker, die <strong>{s.userB.name}</strong> noch dringend fehlen.
                            </span>
                          ) : (
                            <span>
                              <strong>{s.userB.name}</strong> hat doppelte Sticker, die <strong>{s.userA.name}</strong> noch dringend fehlen.
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleExecute(s)}
                          disabled={isLoading}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 font-bold text-[10px] uppercase text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Tauschen
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-indigo-400" /> Auto-Aktualisierung aktiv
              </span>
              <span>Stand: live</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
