import React, { useState } from "react";
import { COUNTRIES, STICKERS_PER_TEAM, UserProfile, getStickersForCountry, getAllStickerCodes } from "../types";
import { Search, ArrowUpDown, CheckCircle, HelpCircle, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { getCountryFlagUrl, getStickerHighlights } from "../playerData";

interface NationsProgressTableProps {
  profile: UserProfile;
  onSelectCountry: (countryKey: string) => void;
}

// Order of nations exactly as listed in the user's provided Panini book order
const CSV_NATION_ORDER = [
  "FWC", // Intro & WM-Historie
  "MEX", "RSA", "KOR", "CZE", // A
  "CAN", "BIH", "QAT", "SUI", // B
  "BRA", "MAR", "HAI", "SCO", // C
  "USA", "PAR", "AUS", "TUR", // D
  "GER", "CUW", "CIV", "ECU", // E
  "NED", "JPN", "SWE", "TUN", // F
  "BEL", "EGY", "IRN", "NZL", // G
  "ESP", "CPV", "KSA", "URU", // H
  "FRA", "SEN", "IRQ", "NOR", // I
  "ARG", "ALG", "AUT", "JOR", // J
  "POR", "COD", "UZB", "COL", // K
  "ENG", "CRO", "GHA", "PAN"  // L
];

export default function NationsProgressTable({ profile, onSelectCountry }: NationsProgressTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Alle");
  const [sortBy, setSortBy] = useState<"default" | "name" | "progress" | "duplicates">("default");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Compute stats for each country
  const countriesData = Object.keys(COUNTRIES).map((key) => {
    const country = COUNTRIES[key];
    const countryName = key === "FWC" ? "Intro & WM-Historie" : country.name;
    const countryCode = key === "FWC" ? "—" : key;
    
    const profileOwned = profile.owned || [];
    const profileDuplicates = profile.duplicates || {};

    // Get all sticker codes for this country
    const countryStickers = getStickersForCountry(key);
    const ownedCount = countryStickers.filter((code) => profileOwned.includes(code)).length;
    const missingCount = STICKERS_PER_TEAM - ownedCount;
    
    // Sum duplicates
    const duplicateCount = countryStickers.reduce(
      (acc, code) => acc + (profileDuplicates[code] || 0),
      0
    );

    const progressPct = (ownedCount / STICKERS_PER_TEAM) * 100;

    return {
      key,
      name: countryName,
      flag: country.flag,
      group: country.group,
      code: countryCode,
      owned: ownedCount,
      missing: missingCount,
      duplicates: duplicateCount,
      progress: progressPct,
    };
  });

  // Filter nations based on search query and group
  const filteredData = countriesData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === "Alle" || item.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  // Sort nations
  const sortedData = [...filteredData].sort((a, b) => {
    let valA: any = 0;
    let valB: any = 0;

    if (sortBy === "default") {
      const idxA = CSV_NATION_ORDER.indexOf(a.key);
      const idxB = CSV_NATION_ORDER.indexOf(b.key);
      valA = idxA !== -1 ? idxA : 999;
      valB = idxB !== -1 ? idxB : 999;
    } else if (sortBy === "name") {
      valA = a.name;
      valB = b.name;
    } else if (sortBy === "progress") {
      valA = a.progress;
      valB = b.progress;
    } else if (sortBy === "duplicates") {
      valA = a.duplicates;
      valB = b.duplicates;
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSortToggle = (type: typeof sortBy) => {
    if (sortBy === type) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(type);
      setSortOrder("asc");
    }
  };

  // Grand totals
  const totalStickers = 980;
  const totalOwned = (profile.owned || []).length;
  const totalMissing = totalStickers - totalOwned;
  const totalDuplicates = Object.values(profile.duplicates || {}).reduce((acc, count) => acc + count, 0);
  const totalProgressPct = ((totalOwned / totalStickers) * 100).toFixed(1);

  // Compute Highlights
  const allCodes = getAllStickerCodes();
  const allFoilCodes = allCodes.filter(c => getStickerHighlights(c).includes("fwc_foil"));
  const allStarCodes = allCodes.filter(c => getStickerHighlights(c).includes("star_player"));
  
  const ownedFoil = allFoilCodes.filter(c => (profile.owned || []).includes(c)).length;
  const ownedStar = allStarCodes.filter(c => (profile.owned || []).includes(c)).length;

  return (
    <div className="flex flex-col gap-6" id="nations-progress-table-root">
      
      {/* Visual grand totals matching the spreadsheet */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Gesamt-Sticker</div>
          <div className="text-2xl font-black font-mono text-slate-100 mt-2">{totalStickers}</div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">Soll-Sammlung</div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Im Album</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-2">{totalOwned}</div>
          <div className="text-[10px] text-emerald-500/80 font-mono mt-1">Eingeklebt</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fehlend</div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-2">{totalMissing}</div>
          <div className="text-[10px] text-rose-500/80 font-mono mt-1">Noch offen</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Doppelte</div>
          <div className="text-2xl font-black font-mono text-indigo-400 mt-2">{totalDuplicates}</div>
          <div className="text-[10px] text-indigo-500/80 font-mono mt-1">Tauschbar</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 col-span-2 md:col-span-1 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fortschritt</div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-2">{totalProgressPct}%</div>
          {/* Micro Progress Bar */}
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-800">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${totalProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Highlights Dashboard */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(251,191,36,0.1)] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-6xl opacity-10">★</div>
          <div className="text-[10px] text-amber-500/80 uppercase font-bold tracking-wider flex items-center gap-1.5 z-10">
            Foil-Specials
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-2 z-10">
            {ownedFoil} <span className="text-sm text-slate-500 font-normal">/ {allFoilCodes.length}</span>
          </div>
          <div className="text-[10px] text-amber-500/60 font-mono mt-1 z-10">gesammelt</div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(244,63,94,0.1)] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-6xl opacity-10">⚡</div>
          <div className="text-[10px] text-rose-500/80 uppercase font-bold tracking-wider flex items-center gap-1.5 z-10">
            Star-Spieler
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-2 z-10">
            {ownedStar} <span className="text-sm text-slate-500 font-normal">/ {allStarCodes.length}</span>
          </div>
          <div className="text-[10px] text-rose-500/60 font-mono mt-1 z-10">gesammelt</div>
        </div>
      </div>

      {/* Control bar with search and layout information */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Land suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-auto"
          >
            <option value="Alle">Alle Gruppen</option>
            <option value="A">Gruppe A</option>
            <option value="B">Gruppe B</option>
            <option value="C">Gruppe C</option>
            <option value="D">Gruppe D</option>
            <option value="E">Gruppe E</option>
            <option value="F">Gruppe F</option>
            <option value="G">Gruppe G</option>
            <option value="H">Gruppe H</option>
            <option value="I">Gruppe I</option>
            <option value="J">Gruppe J</option>
            <option value="K">Gruppe K</option>
            <option value="L">Gruppe L</option>
            <option value="Special">Specials</option>
          </select>
        </div>

        {/* Info Legend Box from Spreadsheet */}
        <div className="text-[11px] text-slate-400 flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800/80 w-full sm:w-auto">
          <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>
            💡 <strong className="text-slate-300">Tipp:</strong> Klicke auf ein Land, um direkt im Album-Reiter dorthin zu springen!
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th 
                  className="py-4 px-5 cursor-pointer hover:bg-slate-900 transition-colors"
                  onClick={() => handleSortToggle("name")}
                >
                  <div className="flex items-center gap-1.5">
                    Nation {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                  </div>
                </th>
                <th className="py-4 px-3 text-center">Code</th>
                <th 
                  className="py-4 px-3 text-center cursor-pointer hover:bg-slate-900 transition-colors"
                  onClick={() => handleSortToggle("progress")}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Im Album {sortBy === "progress" && (sortOrder === "asc" ? "▲" : "▼")}
                  </div>
                </th>
                <th className="py-4 px-3 text-center">Fehlt</th>
                <th 
                  className="py-4 px-3 text-center cursor-pointer hover:bg-slate-900 transition-colors"
                  onClick={() => handleSortToggle("duplicates")}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    Doppelt {sortBy === "duplicates" && (sortOrder === "asc" ? "▲" : "▼")}
                  </div>
                </th>
                <th className="py-4 px-5 text-right w-1/4">Fortschritt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedData.map((item) => {
                const isCompleted = item.owned === STICKERS_PER_TEAM;
                const hasDuplicates = item.duplicates > 0;

                return (
                  <tr
                    key={item.key}
                    onClick={() => onSelectCountry(item.key)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Nation Name + Flag */}
                    <td className="py-3 px-5 font-semibold text-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-slate-950 border border-slate-800 p-1 rounded-lg group-hover:scale-110 transition-transform shrink-0">
                          <img 
                            src={getCountryFlagUrl(item.key)} 
                            alt={item.name} 
                            className={`${item.key === "FWC" ? "w-5 h-5 object-contain" : "w-6 h-4 object-cover rounded"} shadow-sm`}
                            referrerPolicy="no-referrer"
                          />
                        </span>
                        <div>
                          <div className="text-sm text-slate-100 group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                            {item.name}
                            {isCompleted && (
                              <span className="text-emerald-400" title="Vollständig!">
                                <CheckCircle className="h-3.5 w-3.5" />
                              </span>
                            )}
                          </div>
                          {item.key !== "FWC" && (
                            <div className="text-[10px] text-slate-500 font-normal">Gruppe {item.group}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                      {item.code}
                    </td>

                    {/* Owned count */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`px-2.5 py-1 rounded-lg font-bold ${
                        isCompleted
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : item.owned > 0
                          ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/10"
                          : "bg-slate-950 text-slate-600"
                      }`}>
                        {item.owned}
                      </span>
                    </td>

                    {/* Missing count */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`px-2 py-1 rounded-lg ${
                        item.missing === 0
                          ? "text-slate-600"
                          : "text-rose-400"
                      }`}>
                        {item.missing}
                      </span>
                    </td>

                    {/* Duplicate count */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`px-2.5 py-1 rounded-lg font-semibold ${
                        hasDuplicates
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          : "text-slate-600"
                      }`}>
                        {item.duplicates > 0 ? `${item.duplicates}x` : "0"}
                      </span>
                    </td>

                    {/* Progress slider / bar */}
                    <td className="py-3 px-5 text-right font-mono">
                      <div className="flex items-center justify-end gap-3">
                        <div className="text-slate-300 font-bold">{item.progress.toFixed(0)}%</div>
                        <div className="w-24 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? "bg-emerald-500"
                                : item.progress > 50
                                ? "bg-indigo-500"
                                : item.progress > 0
                                ? "bg-indigo-600/70"
                                : "bg-transparent"
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="bg-slate-950/60 p-4 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            Stand: Juni 2026 • Quelle: Offizielle Panini-Checkliste WM 2026 (980 Sticker)
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Im Album
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" /> Doppelt
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-slate-800 inline-block" /> Offen / Fehlt
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
