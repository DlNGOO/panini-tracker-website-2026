import React, { useRef, useState, useEffect } from "react";
import { X, Camera as CameraIcon, CheckCircle, RefreshCcw, Edit2 } from "lucide-react";
import Tesseract, { createWorker } from "tesseract.js";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, getAllStickerCodes, parseStickerCode } from "../types";
import { getStickerName } from "../playerData";

interface StickerScannerProps {
  onClose: () => void;
  profile: UserProfile;
  onUpdateInventory: (owned: string[], duplicates: Record<string, number>) => void;
}

export default function StickerScanner({ onClose, profile, onUpdateInventory }: StickerScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);

  const [status, setStatus] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLog, setOcrLog] = useState("Lade Scanner...");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allKnownCodes = getAllStickerCodes().sort((a, b) => b.length - a.length);

  useEffect(() => {
    let cancelled = false;
    const initWorker = async () => {
      try {
        const w = await createWorker("eng", 1, {
          langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
          logger: (m: { status: string; progress: number }) => {
            if (cancelled) return;
            if (m.status === "recognizing text") {
              setOcrProgress(Math.round(m.progress * 100));
              setOcrLog("Analysiere... " + Math.round(m.progress * 100) + "%");
            } else if (m.status.includes("load")) {
              setOcrLog("Lade Modell...");
            }
          },
        });
        if (cancelled) { w.terminate(); return; }
        await w.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT });
        workerRef.current = w;
        setOcrLog("Bereit zum Scannen");
      } catch {
        setOcrLog("Fehler beim Laden");
      }
    };
    initWorker();
    return () => {
      cancelled = true;
      workerRef.current?.terminate();
    };
  }, []);

  const extractStickerCode = (text: string): string | null => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9\s]/g, "");
    const compact = cleaned.replace(/\s/g, "");
    const tokens = cleaned.split(/\s+/);
    for (const code of allKnownCodes) {
      const c = code.toUpperCase();
      if (cleaned.includes(c) || compact.includes(c)) return code;
      for (let i = 0; i < tokens.length - 1; i++) {
        if (tokens[i] + tokens[i + 1] === c) return code;
      }
    }
    return null;
  };

  const handlePhotoTaken = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setCapturedImage(imageUrl);
    setStatus("scanning");
    setOcrLog("Analysiere Foto...");
    setOcrProgress(0);
    setScannedCode(null);
    setErrorMsg(null);

    if (!workerRef.current) {
      setErrorMsg("Scanner noch nicht bereit. Bitte kurz warten und nochmal versuchen.");
      setStatus("error");
      return;
    }

    try {
      const { data } = await workerRef.current.recognize(file);
      const code = extractStickerCode(data.text);
      if (code) {
        setScannedCode(code);
        setStatus("done");
        setOcrLog("");
      } else {
        setStatus("error");
        const preview = data.text.replace(/\n/g, " ").trim().substring(0, 80);
        setErrorMsg(
          preview
            ? `Kein Code erkannt. Erkannt: "${preview}" – Bitte naher ranhalten oder manuell eingeben.`
            : "Kein Text erkannt. Bitte naher ranhalten."
        );
      }
    } catch {
      setStatus("error");
      setErrorMsg("Fehler beim Scannen. Bitte nochmal versuchen.");
    }
  };

  const handleTakeAnother = () => {
    setStatus("idle");
    setCapturedImage(null);
    setScannedCode(null);
    setErrorMsg(null);
    setSuccessMsg(null);
    setOcrLog("Bereit zum Scannen");
    setOcrProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmAdd = () => {
    if (!scannedCode) return;
    const newOwned = [...profile.owned];
    const newDuplicates = { ...profile.duplicates };
    if (newOwned.includes(scannedCode)) {
      newDuplicates[scannedCode] = (newDuplicates[scannedCode] || 1) + 1;
      setSuccessMsg(`Duplikat von ${scannedCode} (${getStickerName(scannedCode)}) gespeichert!`);
    } else {
      newOwned.push(scannedCode);
      setSuccessMsg(`${scannedCode} (${getStickerName(scannedCode)}) hinzugefuegt!`);
    }
    onUpdateInventory(newOwned, newDuplicates);
    setTimeout(() => handleTakeAnother(), 2000);
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim().toUpperCase();
    if (!allKnownCodes.includes(code)) {
      setErrorMsg(`Code "${code}" nicht gefunden. Bitte pruefen.`);
      return;
    }
    setScannedCode(code);
    setStatus("done");
    setIsManualMode(false);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col overflow-y-auto">
      {/* Native camera file input — works on iOS Safari + all Android */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoTaken}
        className="hidden"
      />

      {/* Header */}
      <div className="sticky top-0 inset-x-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white">
          <CameraIcon className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-lg tracking-wide">Sticker Scannen</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
        <AnimatePresence mode="wait">

          {/* ── IDLE STATE ── */}
          {status === "idle" && !isManualMode && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8 w-full max-w-sm"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Foto vom Sticker-Code</h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  Halte die Kamera nah an den{" "}
                  <strong className="text-indigo-400">Code oben rechts</strong> auf dem
                  Sticker und mache ein Foto.
                </p>
              </div>

              {/* Visual guide */}
              <div className="relative w-52 h-52 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-500/40 bg-white/5 flex items-center justify-center">
                <CameraIcon className="w-16 h-16 text-white/20" />
                {/* Simulated sticker corner */}
                <div className="absolute top-3 right-3">
                  <div className="w-14 h-9 border-2 border-indigo-400 rounded-lg animate-pulse" />
                  <div className="absolute top-1 right-1 bg-indigo-600 rounded-md px-1.5 py-0.5 text-[10px] text-white font-bold">
                    GER10
                  </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">Code oben rechts</span>
                </div>
              </div>

              <p className="text-xs text-white/30 font-mono">{ocrLog}</p>

              <button
                id="scan-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/50 transition-all active:scale-95"
              >
                <CameraIcon className="w-6 h-6" />
                Foto aufnehmen
              </button>

              <button
                onClick={() => setIsManualMode(true)}
                className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Code manuell eingeben
              </button>
            </motion.div>
          )}

          {/* ── SCANNING STATE ── */}
          {status === "scanning" && capturedImage && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <h2 className="text-xl font-bold text-white">Wird analysiert...</h2>
              <div className="relative w-full rounded-2xl overflow-hidden border border-white/10">
                <img src={capturedImage} alt="Sticker" className="w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="bg-black/80 rounded-xl px-4 py-3 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-white text-sm font-mono">{ocrLog}</p>
                    {ocrProgress > 0 && (
                      <div className="w-40 h-1 bg-white/20 rounded-full mt-2 mx-auto overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full transition-all"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ERROR STATE ── */}
          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              {capturedImage && (
                <div className="w-full rounded-2xl overflow-hidden border border-red-500/30">
                  <img src={capturedImage} alt="Sticker" className="w-full object-cover opacity-70" />
                </div>
              )}
              <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-center w-full">
                <p className="text-red-300 text-sm leading-relaxed">{errorMsg}</p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Nochmal versuchen
                </button>
                <button
                  onClick={() => {
                    setIsManualMode(true);
                    setStatus("idle");
                    setCapturedImage(null);
                  }}
                  className="w-full py-3 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                  Manuell eingeben
                </button>
              </div>
            </motion.div>
          )}

          {/* ── SUCCESS STATE ── */}
          {status === "done" && scannedCode && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              {capturedImage && (
                <div className="w-full rounded-2xl overflow-hidden border-2 border-emerald-500/50">
                  <img src={capturedImage} alt="Sticker" className="w-full object-cover" />
                </div>
              )}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-1">Sticker erkannt!</h2>
                <div className="inline-flex items-center gap-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl px-4 py-2 mb-2">
                  <span className="text-2xl font-bold text-indigo-300">{scannedCode}</span>
                </div>
                <p className="text-white/70 text-sm">{getStickerName(scannedCode)}</p>
                {profile.owned.includes(scannedCode) && (
                  <p className="text-amber-400 text-xs mt-1">
                    Bereits vorhanden – wird als Duplikat gezaehlt
                  </p>
                )}
              </div>

              {successMsg ? (
                <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-4 text-center w-full">
                  <p className="text-emerald-300 font-medium">{successMsg}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={handleConfirmAdd}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-900/50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Zur Sammlung hinzufuegen
                  </button>
                  <button
                    onClick={handleTakeAnother}
                    className="w-full py-3 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Anderen Sticker scannen
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── MANUAL ENTRY ── */}
          {isManualMode && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <h2 className="text-xl font-bold text-white">Code eingeben</h2>
              <p className="text-white/50 text-sm text-center">
                z.B.{" "}
                <span className="text-indigo-400 font-mono">GER10</span> oder{" "}
                <span className="text-indigo-400 font-mono">SUI1</span>
              </p>
              {errorMsg && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-center w-full">
                  <p className="text-red-300 text-sm">{errorMsg}</p>
                </div>
              )}
              <input
                type="text"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase());
                  setErrorMsg(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                placeholder="z.B. GER10"
                className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-2xl font-mono text-center placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:bg-white/15 transition-all"
                autoFocus
              />
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setIsManualMode(false);
                    setErrorMsg(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium active:scale-95 transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleManualSubmit}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold active:scale-95 transition-all"
                >
                  Bestaetigen
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}