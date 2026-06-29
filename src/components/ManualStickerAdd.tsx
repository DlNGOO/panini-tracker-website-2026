import React, { useState, useMemo } from "react";
import { X, CheckCircle, Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, getAllStickerCodes, parseStickerCode } from "../types";
import { getStickerName } from "../playerData";

interface ManualStickerAddProps {
  onClose: () => void;
  profile: UserProfile;
  onUpdateInventory: (owned: string[], duplicates: Record<string, number>) => void;
}

export default function ManualStickerAdd({ onClose, profile, onUpdateInventory }: ManualStickerAddProps) {
  const [query, setQuery] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const allCodes = useMemo(() => getAllStickerCodes().sort(), []);

  // Filter codes by query
  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return allCodes.slice(0, 40); // show first 40 when empty
    return allCodes.filter(code =>
      code.toUpperCase().includes(q) ||
      getStickerName(code).toUpperCase().includes(q)
    ).slice(0, 40);
  }, [query, allCodes]);

  const handleAdd = (code: string) => {
    const newOwned = [...profile.owned];
    const newDuplicates = { ...profile.duplicates };

    if (newOwned.includes(code)) {
      newDuplicates[code] = (newDuplicates[code] || 1) + 1;
      setSuccessMsg(`Duplikat von ${code} gespeichert!`);
    } else {
      newOwned.push(code);
      setSuccessMsg(`${code} hinzugefügt! 🎉`);
    }

    setLastAdded(code);
    onUpdateInventory(newOwned, newDuplicates);

    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const getCodeStatus = (code: string) => {
    if (!profile.owned.includes(code)) return "missing";
    if (profile.duplicates[code]) return "duplicate";
    return "owned";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Sticker eintragen</h2>
            <p className="text-slate-500 text-xs mt-0.5">Code suchen und tippen zum Hinzufügen</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Code eingeben, z.B. GER10 oder Deutschland..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Success toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mx-4 mb-2 flex items-center gap-2 bg-emerald-900/50 border border-emerald-600/50 rounded-xl px-3 py-2 flex-shrink-0"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-sm font-medium">{successMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Code list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p className="text-sm">Kein Code gefunden für "{query}"</p>
            </div>
          ) : (
            filtered.map(code => {
              const status = getCodeStatus(code);
              const name = getStickerName(code);
              const isJustAdded = lastAdded === code && !!successMsg;

              return (
                <button
                  key={code}
                  onClick={() => handleAdd(code)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all active:scale-98 text-left ${
                    isJustAdded
                      ? "bg-emerald-900/40 border-emerald-600/50"
                      : status === "missing"
                      ? "bg-slate-800/60 border-slate-700/50 hover:bg-slate-800 hover:border-indigo-500/40"
                      : status === "owned"
                      ? "bg-slate-800/30 border-slate-700/30 hover:bg-amber-900/20 hover:border-amber-500/30"
                      : "bg-slate-800/30 border-slate-700/30 hover:bg-orange-900/20 hover:border-orange-500/30"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      status === "missing" ? "bg-slate-600" :
                      status === "owned"   ? "bg-emerald-500" :
                                            "bg-amber-500"
                    }`} />
                    <div className="min-w-0">
                      <span className="font-bold font-mono text-white text-sm">{code}</span>
                      <p className="text-slate-400 text-xs truncate">{name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {status === "owned" && (
                      <span className="text-xs text-emerald-500 font-medium">Vorhanden</span>
                    )}
                    {status === "duplicate" && (
                      <span className="text-xs text-amber-500 font-medium">
                        {profile.duplicates[code]}× Duplikat
                      </span>
                    )}
                    <div className={`p-1 rounded-lg ${
                      status === "missing"
                        ? "bg-indigo-600/30 text-indigo-400"
                        : "bg-amber-600/20 text-amber-400"
                    }`}>
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })
          )}

          {filtered.length === 40 && (
            <p className="text-center text-xs text-slate-600 py-2">
              Nur erste 40 Ergebnisse — tippe mehr zum Eingrenzen
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
