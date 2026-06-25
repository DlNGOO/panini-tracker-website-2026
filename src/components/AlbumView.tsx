import React, { useState, useCallback } from "react";
import { COUNTRIES, STICKERS_PER_TEAM, UserProfile } from "../types";
import { Check, Plus, Minus, Search, X, ZoomIn, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getStickerName, getStickerImageUrl, getCountryFlagUrl } from "../playerData";

interface AlbumViewProps {
  profile: UserProfile;
  onUpdateInventory: (owned: string[], duplicates: Record<string, number>) => void;
  selectedCountryKey?: string;
  setSelectedCountryKey?: (key: string) => void;
  readonly?: boolean;
}

export default function AlbumView({
  profile,
  onUpdateInventory,
  selectedCountryKey: propSelectedCountryKey,
  setSelectedCountryKey: propSetSelectedCountryKey,
  readonly = false,
}: AlbumViewProps) {
  const [localSelectedCountryKey, setLocalSelectedCountryKey] = useState<string>("GER");
  const selectedCountryKey = propSelectedCountryKey || localSelectedCountryKey;
  const setSelectedCountryKey = propSetSelectedCountryKey || setLocalSelectedCountryKey;

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "missing" | "owned" | "duplicates">("all");
  const [lightboxCode, setLightboxCode] = useState<string | null>(null);

  const countriesKeys = Object.keys(COUNTRIES);
  const profileOwned = profile.owned || [];
  const profileDuplicates = profile.duplicates || {};

  const filteredCountryKeys = countriesKeys.filter((key) => {
    const c = COUNTRIES[key];
    return (
      key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeCountry = COUNTRIES[selectedCountryKey] || COUNTRIES.GER;

  // Toggle sticker owned status (add OR remove)
  const toggleOwned = (stickerCode: string) => {
    if (readonly) return;
    const isOwned = profileOwned.includes(stickerCode);
    let newOwned = [...profileOwned];
    let newDuplicates = { ...profileDuplicates };
    if (isOwned) {
      newOwned = newOwned.filter((code) => code !== stickerCode);
      delete newDuplicates[stickerCode];
    } else {
      newOwned.push(stickerCode);
    }
    onUpdateInventory(newOwned, newDuplicates);
  };

  // Adjust duplicate count
  const adjustDuplicate = (stickerCode: string, amount: number) => {
    if (readonly) return;
    const newDuplicates = { ...profileDuplicates };
    const current = newDuplicates[stickerCode] || 0;
    const nextVal = current + amount;
    if (nextVal <= 0) {
      delete newDuplicates[stickerCode];
    } else {
      newDuplicates[stickerCode] = nextVal;
      if (!profileOwned.includes(stickerCode)) {
        const nextOwned = [...profileOwned, stickerCode];
        onUpdateInventory(nextOwned, newDuplicates);
        return;
      }
    }
    onUpdateInventory(profileOwned, newDuplicates);
  };

  // ── Sticker #1 (Wappen) gets golden shimmer ──
  const isShinySticker = (num: number) => num === 1;

  // ── Double-click ALWAYS toggles (add if missing, remove if owned) ──
  const handleDoubleClick = useCallback((stickerCode: string) => {
    toggleOwned(stickerCode);
  }, [profileOwned, profileDuplicates]);


  // Derive border style based on duplicate count
  const getDuplicateBorderClass = (duplicateCount: number): string => {
    if (duplicateCount === 1) {
      // 1x doppelt → hellrot, klar sichtbar
      return "border-rose-400 shadow-[0_0_14px_rgba(251,113,133,0.5)]";
    }
    if (duplicateCount > 1) {
      // >1x doppelt → dunkelrot, noch stärker hervorgehoben
      return "border-red-700 shadow-[0_0_18px_rgba(185,28,28,0.65)]";
    }
    return "";
  };

  const lightboxSticker = lightboxCode
    ? {
        code: lightboxCode,
        imgUrl: getStickerImageUrl(lightboxCode),
        name: getStickerName(lightboxCode),
        owned: profileOwned.includes(lightboxCode),
        duplicates: profileDuplicates[lightboxCode] || 0,
      }
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="album-view-container">
      {/* ── Country Sidebar ── */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 h-64 lg:h-[calc(100vh-220px)] overflow-y-auto flex flex-col gap-3 shrink-0">
        <h3 className="font-semibold text-slate-200 text-sm tracking-wide uppercase px-2">Länder / Teams</h3>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Suchen (z.B. GER, Marokko)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterMode("all")}
            className={`py-1.5 rounded-lg font-medium transition-all ${filterMode === "all" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilterMode("missing")}
            className={`py-1.5 rounded-lg font-medium transition-all ${filterMode === "missing" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
          >
            Fehlende
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-1 mt-2">
          {filteredCountryKeys.map((key) => {
            const country = COUNTRIES[key];
            const countryStickers = Array.from({ length: STICKERS_PER_TEAM }, (_, i) => `${key}${i + 1}`);
            const ownedInCountry = countryStickers.filter((code) => profileOwned.includes(code)).length;
            const progressPct = Math.round((ownedInCountry / STICKERS_PER_TEAM) * 100);
            return (
              <button
                key={key}
                onClick={() => setSelectedCountryKey(key)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                  selectedCountryKey === key
                    ? "bg-indigo-950/40 border border-indigo-800/60 text-indigo-200"
                    : "border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-slate-950 border border-slate-800 p-1 rounded-lg shrink-0">
                    <img
                      src={getCountryFlagUrl(key)}
                      alt={country.name}
                      className={`${key === "FWC" ? "w-5 h-5 object-contain" : "w-6 h-4 object-cover rounded"} shadow-sm`}
                      referrerPolicy="no-referrer"
                    />
                  </span>
                  <div>
                    <div className="font-semibold text-sm text-slate-200">{country.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono tracking-wider">{key} • Gruppe {country.group}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-300 font-mono">{ownedInCountry}/{STICKERS_PER_TEAM}</div>
                  <div className="w-12 h-1 bg-slate-950 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
          {filteredCountryKeys.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">Keine Länder gefunden</div>
          )}
        </div>
      </div>

      {/* ── Album Panel ── */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {/* Country Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-14 h-14 shadow-inner bg-slate-950 p-2 rounded-xl border border-slate-800 shrink-0">
              <img
                src={getCountryFlagUrl(selectedCountryKey)}
                alt={activeCountry.name}
                className={`${selectedCountryKey === "FWC" ? "w-10 h-10 object-contain" : "w-11 h-8 object-cover rounded-md"} shadow-sm`}
                referrerPolicy="no-referrer"
              />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">{activeCountry.name}</h2>
                <span className="bg-indigo-900/40 text-indigo-300 border border-indigo-800/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Gruppe {activeCountry.group}
                </span>
              </div>
              {!readonly && (
                <p className="text-slate-400 text-xs mt-1">
                  <span className="text-amber-400 font-bold">Doppelklick</span> zum Sammeln / Entfernen ·{" "}
                  <span className="text-indigo-400 font-bold">Klick</span> auf gesammelte Sticker für Großansicht
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-center min-w-[80px]">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Gesammelt</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {Array.from({ length: STICKERS_PER_TEAM }).filter((_, i) => profileOwned.includes(`${selectedCountryKey}${i + 1}`)).length}
              </div>
            </div>
            <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-center min-w-[80px]">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Doppelt</div>
              <div className="text-lg font-bold text-rose-400 font-mono">
                {Array.from({ length: STICKERS_PER_TEAM }).reduce<number>((acc, _, i) => acc + (profileDuplicates[`${selectedCountryKey}${i + 1}`] || 0), 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Sticker Grid – 600×835 aspect ratio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: STICKERS_PER_TEAM }).map((_, idx) => {
            const num = idx + 1;
            const stickerCode = `${selectedCountryKey}${num}`;
            const owned = profileOwned.includes(stickerCode);
            const duplicateCount = profileDuplicates[stickerCode] || 0;
            const shiny = isShinySticker(num);
            const imgUrl = getStickerImageUrl(stickerCode);

            if (filterMode === "missing" && owned) return null;
            if (filterMode === "owned" && !owned) return null;
            if (filterMode === "duplicates" && duplicateCount === 0) return null;

            // ── Border class logic ──
            // Priority: duplicate color > owned-default > unowned
            let borderClass = "";
            let shadowClass = "";
            if (owned) {
              if (duplicateCount === 1) {
                borderClass = "border-rose-400";
                shadowClass = "shadow-[0_0_14px_rgba(251,113,133,0.55)]";
              } else if (duplicateCount > 1) {
                borderClass = "border-red-700";
                shadowClass = "shadow-[0_0_18px_rgba(185,28,28,0.7)]";
              } else if (shiny) {
                borderClass = "border-amber-500/80";
                shadowClass = "shadow-[0_0_20px_rgba(245,158,11,0.25)]";
              } else {
                borderClass = "border-emerald-500/40";
                shadowClass = "shadow-md";
              }
            } else {
              borderClass = "border-slate-700 border-dashed";
              shadowClass = "";
            }

            return (
              <motion.div
                key={stickerCode}
                layoutId={`sticker-card-${stickerCode}`}
                id={`sticker-${stickerCode}`}
                className={`relative rounded-xl border flex flex-col overflow-hidden transition-all duration-300 select-none cursor-pointer ${borderClass} ${shadowClass} ${
                  owned ? "" : "bg-slate-950/60 hover:border-slate-500 hover:bg-slate-900/40"
                }`}
                style={{ aspectRatio: "600 / 835" }}
                onDoubleClick={() => !readonly && handleDoubleClick(stickerCode)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                title={readonly ? undefined : (owned ? "Doppelklick zum Entfernen" : "Doppelklicken zum Sammeln")}
              >
                {/* Shiny shimmer overlay (Badge/Wappen sticker) */}
                {owned && shiny && duplicateCount === 0 && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-300/15 pointer-events-none z-10 animate-pulse" />
                )}

                {owned && imgUrl ? (
                  /* ── OWNED: Real sticker image ── */
                  <>
                    <img
                      src={imgUrl}
                      alt={`Sticker ${stickerCode}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />

                    {/* Top overlay strip */}
                    <div className="absolute top-0 inset-x-0 flex items-start justify-between p-1.5 z-20">
                      <span className="font-mono text-[8px] font-bold text-white/80 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                        {stickerCode}
                      </span>
                      <div className="flex gap-1 items-center">
                        {duplicateCount > 0 && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                            duplicateCount > 1 ? "bg-red-700/90 text-white" : "bg-rose-400/90 text-white"
                          }`}>
                            +{duplicateCount}x
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setLightboxCode(stickerCode); }}
                          className="text-white/80 hover:text-white p-1 rounded bg-black/30 hover:bg-black/60 backdrop-blur-sm transition-colors ctrl-btn"
                          title="Info / Zoom"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom duplicate counter strip */}
                    {!readonly && (
                      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-1.5 py-1 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-20 ctrl-btn">
                        <span className="text-[8px] text-white/60 font-semibold uppercase tracking-wide truncate max-w-[50%]">
                          {duplicateCount > 0 ? `${duplicateCount}x doppelt` : "einmalig"}
                        </span>
                        <div className="flex items-center gap-0.5 ctrl-btn">
                          <button
                            onClick={(e) => { e.stopPropagation(); adjustDuplicate(stickerCode, -1); }}
                            className="p-0.5 rounded bg-white/15 hover:bg-white/30 text-white transition-colors ctrl-btn"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className={`text-[9px] font-bold font-mono px-1 rounded py-0.5 ctrl-btn ${
                            duplicateCount > 1 ? "bg-red-700/80 text-white" : duplicateCount === 1 ? "bg-rose-400/80 text-white" : "bg-white/10 text-white/50"
                          }`}>
                            {duplicateCount}x
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); adjustDuplicate(stickerCode, 1); }}
                            className="p-0.5 rounded bg-white/15 hover:bg-white/30 text-white transition-colors ctrl-btn"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    )}

                  </>
                ) : (
                  /* ── UNOWNED: Placeholder ── */
                  <div className="absolute inset-0 flex flex-col">
                    {imgUrl && (
                      <img
                        src={imgUrl}
                        alt={`Sticker ${stickerCode} fehlt`}
                        className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 mix-blend-luminosity"
                        draggable={false}
                      />
                    )}
                    <div className="relative z-10 flex items-start justify-between p-1.5">
                      <span className="font-mono text-[9px] font-bold text-slate-300 bg-slate-950/70 px-1.5 py-0.5 rounded backdrop-blur-sm tracking-wider">
                        {stickerCode}
                      </span>
                      <span className="text-rose-400 text-[8px] bg-rose-950/50 border border-rose-900/50 px-1.5 py-0.5 rounded font-bold backdrop-blur-sm">
                        FEHLT
                      </span>
                    </div>
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-1.5 px-2">
                      {!imgUrl && (
                        <>
                          <div className="text-3xl font-black font-mono text-slate-700">{num}</div>
                          <img
                            src={getCountryFlagUrl(selectedCountryKey)}
                            alt={activeCountry.name}
                            className={`${selectedCountryKey === "FWC" ? "w-6 h-6 object-contain" : "w-7 h-5 object-cover rounded"} opacity-25`}
                            referrerPolicy="no-referrer"
                          />
                        </>
                      )}
                    </div>
                    <div className="relative z-10 p-1.5 border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-sm">
                      <div className="text-center text-[9px] text-slate-300 font-medium tracking-wide truncate">
                        {getStickerName(stickerCode)}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-medium px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-emerald-500/60 bg-transparent inline-block" />
            Gesammelt (einmalig)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-rose-400 bg-transparent inline-block shadow-[0_0_6px_rgba(251,113,133,0.5)]" />
            1× doppelt
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-2 border-red-700 bg-transparent inline-block shadow-[0_0_6px_rgba(185,28,28,0.6)]" />
            &gt;1× doppelt
          </span>
        </div>
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxSticker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setLightboxCode(null)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative max-h-[90vh] max-w-sm w-full flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxCode(null)}
                className="absolute -top-3 -right-3 z-10 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 rounded-full p-1.5 transition-all"
              >
                <X className="h-4 w-4" />
              </button>

              {lightboxSticker.imgUrl && (
                <div
                  className={`relative rounded-2xl overflow-hidden shadow-2xl border-2 ${
                    lightboxSticker.duplicates > 1
                      ? "border-red-700 shadow-[0_0_30px_rgba(185,28,28,0.5)]"
                      : lightboxSticker.duplicates === 1
                      ? "border-rose-400 shadow-[0_0_25px_rgba(251,113,133,0.4)]"
                      : "border-white/10"
                  }`}
                  style={{ aspectRatio: "600/835", width: "100%" }}
                >
                  <img
                    src={lightboxSticker.imgUrl}
                    alt={`Sticker ${lightboxSticker.code}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-2xl px-5 py-3 w-full flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-xs text-indigo-400 font-bold">{lightboxSticker.code}</div>
                  <div className="text-slate-200 font-semibold text-sm mt-0.5 leading-tight">{lightboxSticker.name}</div>
                </div>
                <div className="flex items-center gap-2 ctrl-btn">
                  <button
                    onClick={() => adjustDuplicate(lightboxSticker.code, -1)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ctrl-btn"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className={`text-sm font-bold font-mono px-2 py-1 rounded-lg ${
                    lightboxSticker.duplicates > 1
                      ? "bg-red-700 text-white"
                      : lightboxSticker.duplicates === 1
                      ? "bg-rose-400 text-white"
                      : "bg-slate-800 text-slate-500"
                  }`}>
                    {lightboxSticker.duplicates}× doppelt
                  </span>
                  <button
                    onClick={() => adjustDuplicate(lightboxSticker.code, 1)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ctrl-btn"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => { toggleOwned(lightboxSticker.code); setLightboxCode(null); }}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors font-semibold"
              >
                Sticker aus Sammlung entfernen
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
