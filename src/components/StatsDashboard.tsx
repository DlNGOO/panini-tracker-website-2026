import React, { useState } from "react";
import { UserProfile, getAllStickerCodes } from "../types";
import Avatar from "./Avatar";
import { Award, Star, Flame, MessageSquare, Plus, Trash2, Shield, Heart } from "lucide-react";
import { motion } from "motion/react";

interface StatsDashboardProps {
  profiles: UserProfile[];
  onAddProfile: (name: string, avatar: string) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
  isLoading: boolean;
}

export default function StatsDashboard({ profiles, onAddProfile, onDeleteProfile, isLoading }: StatsDashboardProps) {
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileAvatar, setNewProfileAvatar] = useState("👤");
  const [error, setError] = useState<string | null>(null);

  const TOTAL_ALBUM_SIZE = 980; // 48 * 20 + 20

  const sortedByCompletion = [...profiles].sort((a, b) => ((b.owned || []).length) - ((a.owned || []).length));

  // Compute duplicate counts
  const getDuplicateTotal = (profile: UserProfile) => {
    return Object.values(profile.duplicates || {}).reduce((acc, count) => acc + count, 0);
  };

  const sortedByDuplicates = [...profiles].sort((a, b) => getDuplicateTotal(b) - getDuplicateTotal(a));

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) {
      setError("Name darf nicht leer sein.");
      return;
    }
    setError(null);
    try {
      await onAddProfile(newProfileName.trim(), newProfileAvatar);
      setNewProfileName("");
      setNewProfileAvatar("👤");
    } catch (err: any) {
      setError(err.message || "Fehler beim Erstellen des Profils");
    }
  };

  // Lore / Funny Chat Log Quotes
  const funnyQuotes = [
    {
      user: "Hassan 👑",
      message: "Messi schon eingeklebt damit mir den keiner klaut wie Vika und Laura bei dir!",
      date: "21. Juni 2026",
      emoji: "🐐"
    },
    {
      user: "Benny 🦁",
      message: "Ich sage ihm noch so auf Ansage Imagine da ist jetzt Ronaldo drin und dreimal kannst du raten wer drin war!",
      date: "21. Juni 2026",
      emoji: "🌟"
    },
    {
      user: "Jonas (Femboy) 🌸",
      message: "Jonas kommst du auch oder gehen wir zum csd? (Oliver)",
      date: "16. Juni 2026",
      emoji: "🏳️‍🌈"
    },
    {
      user: "Lore 💨",
      message: "Vika hat auf Bennys wertvollste Karte (Ronaldo) draufgefurzt!",
      date: "22. Juni 2026",
      emoji: "💨"
    },
    {
      user: "Laura & Oliver 🤣",
      message: "Laura und der andere komische haben sich auf Ronaldo drauf gehockt und unter ihrem arsch versteckt.",
      date: "22. Juni 2026",
      emoji: "🍑"
    },
    {
      user: "Benny 🦁",
      message: "Ich kaufe nur Lego Figuren weil die verbrauchen am wenigsten Platz und haben die höchste Gewinn Masche.",
      date: "22. Juni 2026",
      emoji: "🧱"
    }
  ];

  const avatars = ["👤", "⚽", "🦁", "👑", "🌸", "🧙‍♂️", "🦖", "🍟", "💎", "🦄"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="stats-dashboard-container">
      {/* Leaderboard Column */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Progress Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-indigo-400" /> Sammel-Bestenliste (Leaderboard)
          </h3>
          <div className="space-y-4">
            {sortedByCompletion.map((profile, idx) => {
              const count = (profile.owned || []).length;
              const pct = ((count / TOTAL_ALBUM_SIZE) * 100).toFixed(1);
              const rank = idx + 1;

              return (
                <div key={profile.id} className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex items-center gap-4 justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-mono font-black text-slate-600 w-5 text-center text-sm">
                      #{rank}
                    </span>
                    <Avatar avatar={profile.avatar} className="text-3xl bg-slate-900 border border-slate-800 p-2 rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 truncate">{profile.name}</span>
                        {rank === 1 && count > 0 && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                            👑 Leader
                          </span>
                        )}
                      </div>
                      
                      {/* Bar */}
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2 border border-slate-800/40">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold font-mono text-slate-100 text-sm">
                      {count} <span className="text-slate-500 font-normal">/ {TOTAL_ALBUM_SIZE}</span>
                    </span>
                    <div className="text-xs text-indigo-400 font-semibold font-mono">{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bento Fun Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Most Duplicates */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Flame className="h-4.5 w-4.5 text-orange-400" /> Tausch-Könige (Meiste Doppelten)
            </h4>
            <div className="space-y-3">
              {sortedByDuplicates.slice(0, 3).map((p, idx) => {
                const totalDup = getDuplicateTotal(p);
                return (
                  <div key={p.id} className="flex items-center justify-between text-sm bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <Avatar avatar={p.avatar} className="text-sm shrink-0" />
                      <span className="font-semibold text-slate-300">{p.name}</span>
                    </div>
                    <span className="font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-lg text-xs">
                      {totalDup}x doppelt
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Golden Legends Check */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star className="h-4.5 w-4.5 text-amber-400" /> Goldene Legenden (Messi / Ronaldo)
            </h4>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-xl">🐐</span>
                <div>
                  <div className="font-bold text-slate-200">Messi (ARG10)</div>
                  <div className="text-slate-400 mt-0.5 flex flex-wrap gap-1">
                    Besitzer:{" "}
                    {profiles.some((p) => (p.owned || []).includes("ARG10")) ? (
                      profiles
                        .filter((p) => (p.owned || []).includes("ARG10"))
                        .map((p) => (
                          <span key={p.id} className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                            {p.name} (eingeklebt)
                          </span>
                        ))
                    ) : (
                      <span className="text-slate-500 italic">Noch niemand</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-xl">👑</span>
                <div>
                  <div className="font-bold text-slate-200">Ronaldo (POR5)</div>
                  <div className="text-slate-400 mt-0.5 flex flex-wrap gap-1">
                    Besitzer:{" "}
                    {profiles.some((p) => (p.owned || []).includes("POR5")) ? (
                      profiles
                        .filter((p) => (p.owned || []).includes("POR5"))
                        .map((p) => (
                          <span key={p.id} className="text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                            {p.name}
                          </span>
                        ))
                    ) : (
                      <span className="text-slate-500 italic">Noch niemand</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Chat Chronicle Lore */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5 text-indigo-400" /> WhatsApp-Chronik & Lore
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {funnyQuotes.map((q, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
                <span className="absolute right-3 top-3 text-2xl opacity-15 select-none">{q.emoji}</span>
                <p className="text-slate-300 italic text-xs leading-relaxed font-sans mb-3">
                  "{q.message}"
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span className="font-bold text-slate-400">{q.user}</span>
                  <span>{q.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Friends & Members Management Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Gruppenmitglieder</h3>
          <p className="text-slate-400 text-xs mt-1">
            Füge Freunde hinzu, um ihre doppelten Sticker ebenfalls mit der Gruppe zu vergleichen!
          </p>
        </div>

        {/* Create Profile Form */}
        <form onSubmit={handleCreateProfile} className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex flex-col gap-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Neuer Sammler</div>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Name (z.B. Laura, Vika)..."
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            
            <select
              value={newProfileAvatar}
              onChange={(e) => setNewProfileAvatar(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {avatars.map((av) => (
                <option key={av} value={av}>
                  {av}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="text-rose-400 text-[11px] font-medium">{error}</div>}

          <button
            type="submit"
            disabled={isLoading || !newProfileName.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 font-bold text-xs py-2 rounded-lg text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Sammler hinzufügen
          </button>
        </form>

        {/* Members list with delete triggers */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
          {profiles.map((p) => {
            const isCore = ["benny", "hassan", "oliver", "jonas"].includes(p.id);
            return (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950">
                <div className="flex items-center gap-3">
                  <Avatar avatar={p.avatar} className="text-2xl bg-slate-900 border border-slate-800 p-1.5 rounded-lg" />
                  <div>
                    <div className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                      {p.name}
                      {isCore && (
                        <span className="bg-indigo-950 text-indigo-400 border border-indigo-900 text-[8px] px-1 rounded uppercase font-bold tracking-wider">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{(p.owned || []).length} Sticker gesammelt</div>
                  </div>
                </div>

                {!isCore && (
                  <button
                    onClick={() => onDeleteProfile(p.id)}
                    className="p-1.5 rounded-lg border border-transparent text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
                    title="Profil löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
