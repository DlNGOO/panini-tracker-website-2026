import React, { useState } from "react";
import { UserProfile, COUNTRIES } from "../types";
import Avatar from "./Avatar";
import { ArrowLeftRight, Check, Trash2, UserPlus, Gift, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getStickerName, getCountryFlagUrl } from "../playerData";

interface TradeCenterProps {
  profiles: UserProfile[];
  onExecuteTrade: (
    userAId: string,
    userBId: string,
    userAGives: string[],
    userBGives: string[]
  ) => Promise<void>;
  isLoading: boolean;
}

export default function TradeCenter({ profiles, onExecuteTrade, isLoading }: TradeCenterProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Compute all trade matches among profiles
  const calculateTrades = () => {
    const tradesList: {
      id: string;
      userA: UserProfile;
      userB: UserProfile;
      userAGives: string[];
      userBGives: string[];
      type: "perfect" | "one-way-A" | "one-way-B";
    }[] = [];

    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const userA = profiles[i];
        const userB = profiles[j];

        const duplicatesA = Object.keys(userA.duplicates || {}).filter((code) => (userA.duplicates?.[code] || 0) > 0);
        // Duplicates B has
        const duplicatesB = Object.keys(userB.duplicates || {}).filter((code) => (userB.duplicates?.[code] || 0) > 0);

        const userBOwned = userB.owned || [];
        const userAOwned = userA.owned || [];

        // What A can give to B (duplicates of A that B does not own)
        const userAGives = duplicatesA.filter((code) => !userBOwned.includes(code));
        // What B can give to A (duplicates of B that A does not own)
        const userBGives = duplicatesB.filter((code) => !userAOwned.includes(code));

        if (userAGives.length > 0 || userBGives.length > 0) {
          let type: "perfect" | "one-way-A" | "one-way-B" = "perfect";
          if (userAGives.length > 0 && userBGives.length === 0) {
            type = "one-way-A"; // Only A has duplicates B needs
          } else if (userBGives.length > 0 && userAGives.length === 0) {
            type = "one-way-B"; // Only B has duplicates A needs
          }

          tradesList.push({
            id: `${userA.id}-${userB.id}`,
            userA,
            userB,
            userAGives,
            userBGives,
            type,
          });
        }
      }
    }

    // Sort: perfect matches first, then largest number of items tradable
    return tradesList.sort((a, b) => {
      if (a.type === "perfect" && b.type !== "perfect") return -1;
      if (a.type !== "perfect" && b.type === "perfect") return 1;
      const totalItemsA = a.userAGives.length + a.userBGives.length;
      const totalItemsB = b.userAGives.length + b.userBGives.length;
      return totalItemsB - totalItemsA;
    });
  };

  const trades = calculateTrades();

  const handleTradeClick = async (
    userAId: string,
    userBId: string,
    userAGives: string[],
    userBGives: string[],
    nameA: string,
    nameB: string
  ) => {
    try {
      await onExecuteTrade(userAId, userBId, userAGives, userBGives);
      setSuccessMessage(`Tausch zwischen ${nameA} und ${nameB} erfolgreich durchgeführt!`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Trade execution failed:", err);
    }
  };

  const getCountryFlagAndName = (code: string) => {
    const countryPart = code.substring(0, 3).toUpperCase();
    const c = COUNTRIES[countryPart];
    return {
      flag: c ? c.flag : "🏳️",
      name: c ? c.name : countryPart,
      num: code.substring(3),
    };
  };

  return (
    <div className="space-y-6" id="trade-center-container">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-6 w-6 text-indigo-400" />
          <h2 className="text-xl font-bold text-slate-100">Intelligenter Tausch-Finder</h2>
        </div>
        <p className="text-slate-400 text-sm mt-2 max-w-3xl">
          Diese Tauschbörse vergleicht die doppelten Sticker aller Gruppenmitglieder automatisch mit den fehlenden Stickern der anderen. Perfect Matches werden ganz oben angezeigt!
        </p>
      </div>

      {/* Success Alert */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400 text-sm"
          >
            <Check className="h-5 w-5 shrink-0" />
            <div>{successMessage}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trades List */}
      <div className="space-y-4">
        {trades.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <AlertCircle className="h-10 w-10 text-slate-500 mb-3" />
            <h3 className="font-bold text-slate-300 text-lg">Keine Tauschmöglichkeiten</h3>
            <p className="text-slate-500 text-sm max-w-md mt-1">
              Aktuell gibt es keine passenden Überschneidungen in der Gruppe. Tragt mehr doppelte Sticker in euer Album ein oder importiert eure WhatsApp-Listen!
            </p>
          </div>
        ) : (
          trades.map((trade) => {
            const isPerfect = trade.type === "perfect";
            
            return (
              <motion.div
                key={trade.id}
                layout
                className={`bg-slate-900 border rounded-2xl p-5 transition-all duration-300 ${
                  isPerfect ? "border-indigo-500/50 shadow-[0_4px_20px_rgba(99,102,241,0.05)]" : "border-slate-800"
                }`}
              >
                {/* Proposal Status bar */}
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    {isPerfect ? (
                      <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                        <ArrowLeftRight className="h-3.5 w-3.5" /> Perfect Match (Tausch)
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5" /> Einseitiges Angebot
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {trade.userAGives.length + trade.userBGives.length} Sticker im Angebot
                  </div>
                </div>

                {/* Users comparison panel */}
                <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4">
                  {/* User A Details */}
                  <div className="md:col-span-3 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 min-h-[160px]">
                    <div className="flex items-center gap-2.5">
                      <Avatar avatar={trade.userA.avatar} className="text-2xl" />
                      <span className="font-bold text-slate-200">{trade.userA.name}</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                        Bietet an ({trade.userAGives.length}):
                      </div>
                      {trade.userAGives.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {trade.userAGives.map((code) => {
                            const info = getCountryFlagAndName(code);
                            return (
                              <span
                                key={code}
                                className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 px-1.5 py-0.5 rounded-lg"
                                title={`${info.name} • ${getStickerName(code)}`}
                              >
                                <img 
                                  src={getCountryFlagUrl(code.substring(0, 3))} 
                                  alt="" 
                                  className={`${code.startsWith("FWC") ? "w-3.5 h-3.5 object-contain" : "w-4 h-2.5 object-cover rounded-sm"} shadow-sm shrink-0`}
                                  referrerPolicy="no-referrer"
                                />
                                <span>{code}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Bietet diesmal nichts an</span>
                      )}
                    </div>
                  </div>

                  {/* Transfer Visual Arrows */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center py-2">
                    <div className="bg-slate-950 p-3 rounded-full border border-slate-800 text-indigo-400 shadow-inner">
                      <ArrowLeftRight className="h-5 w-5 animate-pulse" />
                    </div>
                  </div>

                  {/* User B Details */}
                  <div className="md:col-span-3 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 min-h-[160px]">
                    <div className="flex items-center gap-2.5">
                      <Avatar avatar={trade.userB.avatar} className="text-2xl" />
                      <span className="font-bold text-slate-200">{trade.userB.name}</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                        Bietet an ({trade.userBGives.length}):
                      </div>
                      {trade.userBGives.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {trade.userBGives.map((code) => {
                            const info = getCountryFlagAndName(code);
                            return (
                              <span
                                key={code}
                                className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 px-1.5 py-0.5 rounded-lg"
                                title={`${info.name} • ${getStickerName(code)}`}
                              >
                                <img 
                                  src={getCountryFlagUrl(code.substring(0, 3))} 
                                  alt="" 
                                  className={`${code.startsWith("FWC") ? "w-3.5 h-3.5 object-contain" : "w-4 h-2.5 object-cover rounded-sm"} shadow-sm shrink-0`}
                                  referrerPolicy="no-referrer"
                                />
                                <span>{code}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Bietet diesmal nichts an</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trade execution Action Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() =>
                      handleTradeClick(
                        trade.userA.id,
                        trade.userB.id,
                        trade.userAGives,
                        trade.userBGives,
                        trade.userA.name,
                        trade.userB.name
                      )
                    }
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 font-semibold text-sm text-white px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" /> Tausch wird durchgeführt...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Tausch jetzt durchführen
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
