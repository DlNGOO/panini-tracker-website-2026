import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Edit2, CheckCircle, RefreshCcw } from "lucide-react";
import Tesseract, { createWorker } from "tesseract.js";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, getAllStickerCodes } from "../types";
import { getStickerName } from "../playerData";

interface StickerScannerProps {
  onClose: () => void;
  profile: UserProfile;
  onUpdateInventory: (owned: string[], duplicates: Record<string, number>) => void;
}

interface DetectionBox {
  x: number; y: number; w: number; h: number;
  label?: string;
  color: string;
}

export default function StickerScanner({ onClose, profile, onUpdateInventory }: StickerScannerProps) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const hiddenCanvas  = useRef<HTMLCanvasElement>(null);
  const overlayCanvas = useRef<HTMLCanvasElement>(null);
  const workerRef     = useRef<Tesseract.Worker | null>(null);
  const activeRef     = useRef(true);
  const trackRef      = useRef<MediaStreamVideoTrack | null>(null);
  const scanningRef   = useRef(false);

  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const allKnownCodes = getAllStickerCodes().sort((a, b) => b.length - a.length);

  const extractCode = (text: string): string | null => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9\s]/g, "");
    const compact = cleaned.replace(/\s/g, "");
    const tokens  = cleaned.split(/\s+/);
    for (const code of allKnownCodes) {
      const c = code.toUpperCase();
      if (cleaned.includes(c) || compact.includes(c)) return code;
      for (let i = 0; i < tokens.length - 1; i++) {
        if (tokens[i] + tokens[i + 1] === c) return code;
      }
    }
    return null;
  };

  const drawBoxes = useCallback((boxes: DetectionBox[], vw: number, vh: number) => {
    const oc  = overlayCanvas.current;
    const vid = videoRef.current;
    if (!oc || !vid) return;
    oc.width  = vid.clientWidth;
    oc.height = vid.clientHeight;
    const scaleX = oc.width  / (vw || 1);
    const scaleY = oc.height / (vh || 1);
    const ctx = oc.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, oc.width, oc.height);
    for (const b of boxes) {
      const x = b.x * scaleX, y = b.y * scaleY;
      const w = b.w * scaleX, h = b.h * scaleY;
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth   = 3;
      ctx.shadowColor = b.color;
      ctx.shadowBlur  = 12;
      ctx.strokeRect(x, y, w, h);
      if (b.label) {
        ctx.fillStyle = b.color;
        ctx.font = "bold 13px monospace";
        ctx.fillText(b.label, x + 4, Math.max(y - 5, 14));
      }
      ctx.restore();
    }
  }, []);

  const clearOverlay = useCallback(() => {
    const oc  = overlayCanvas.current;
    const vid = videoRef.current;
    if (!oc || !vid) return;
    oc.width  = vid.clientWidth;
    oc.height = vid.clientHeight;
    oc.getContext("2d")?.clearRect(0, 0, oc.width, oc.height);
  }, []);

  const grabFrame = useCallback(async (): Promise<{ ok: boolean; w: number; h: number }> => {
    const hc  = hiddenCanvas.current;
    const vid = videoRef.current;
    if (!hc || !vid) return { ok: false, w: 0, h: 0 };

    if (trackRef.current && typeof (window as any).ImageCapture !== "undefined") {
      try {
        const ic  = new (window as any).ImageCapture(trackRef.current);
        const bmp = await ic.grabFrame() as ImageBitmap;
        hc.width  = bmp.width;
        hc.height = bmp.height;
        hc.getContext("2d", { willReadFrequently: true })?.drawImage(bmp, 0, 0);
        bmp.close();
        return { ok: hc.width > 0, w: hc.width, h: hc.height };
      } catch { /* fall through */ }
    }

    const w = vid.videoWidth  || vid.clientWidth  || 0;
    const h = vid.videoHeight || vid.clientHeight || 0;
    if (!w) return { ok: false, w: 0, h: 0 };
    hc.width  = w;
    hc.height = h;
    hc.getContext("2d", { willReadFrequently: true })?.drawImage(vid, 0, 0, w, h);
    return { ok: true, w, h };
  }, []);

  const runScan = useCallback(async () => {
    if (!activeRef.current || scanningRef.current) return;
    const worker = workerRef.current;
    if (!worker) return;

    scanningRef.current = true;
    try {
      const { ok, w, h } = await grabFrame();
      if (!ok) return;

      const hc = hiddenCanvas.current!;
      const { data } = await worker.recognize(hc);
      if (!activeRef.current) return;

      const code = extractCode(data.text);
      if (code) {
        const boxes: DetectionBox[] = [];
        const codeUpper = code.toUpperCase();

        for (const word of data.words) {
          const wc = word.text.toUpperCase().replace(/[^A-Z0-9]/g, "");
          if (wc.length >= 2 && codeUpper.includes(wc)) {
            const b = word.bbox;
            boxes.push({ x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0, label: word.text, color: "#22c55e" });
          }
        }

        boxes.push({ x: w * 0.5, y: 0, w: w * 0.5, h: h * 0.3, color: "#22c55e" });
        drawBoxes(boxes, w, h);
        setScannedCode(code);
        return;
      }
    } catch { /* ignore */ }
    finally { scanningRef.current = false; }

    if (activeRef.current) setTimeout(runScan, 1200);
  }, [drawBoxes, grabFrame]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    activeRef.current = true;
    let stream: MediaStream | null = null;

    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (!activeRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        trackRef.current = stream.getVideoTracks()[0] as MediaStreamVideoTrack;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch { /* camera unavailable */ }

      try {
        const w = await createWorker("eng", 1, {
          langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
        });
        if (!activeRef.current) { w.terminate(); return; }
        await w.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT });
        workerRef.current = w;
        setTimeout(runScan, 1500);
      } catch { /* tesseract unavailable */ }
    };

    init();

    return () => {
      activeRef.current = false;
      stream?.getTracks().forEach(t => t.stop());
      workerRef.current?.terminate();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!scannedCode && workerRef.current && activeRef.current) {
      clearOverlay();
      setTimeout(runScan, 600);
    }
  }, [scannedCode, runScan, clearOverlay]);

  const handleConfirmAdd = () => {
    if (!scannedCode) return;
    const newOwned = [...profile.owned];
    const newDuplicates = { ...profile.duplicates };
    if (newOwned.includes(scannedCode)) {
      newDuplicates[scannedCode] = (newDuplicates[scannedCode] || 1) + 1;
      setSuccessMsg("Duplikat " + scannedCode + " gespeichert");
    } else {
      newOwned.push(scannedCode);
      setSuccessMsg(scannedCode + " hinzugefügt! 🎉");
    }
    onUpdateInventory(newOwned, newDuplicates);
    setTimeout(() => { setSuccessMsg(null); setScannedCode(null); }, 1800);
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim().toUpperCase();
    if (!allKnownCodes.includes(code)) { setManualError('"' + code + '" nicht gefunden.'); return; }
    setScannedCode(code);
    setIsManualMode(false);
    setManualError("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
      />

      <canvas ref={overlayCanvas} className="absolute inset-0 w-full h-full pointer-events-none" />
      <canvas ref={hiddenCanvas} className="hidden" />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm"
      >
        <X className="w-5 h-5" />
      </button>

      {!scannedCode && !isManualMode && (
        <button
          onClick={() => setIsManualMode(true)}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 text-white/70 text-sm backdrop-blur-sm border border-white/20"
        >
          <Edit2 className="w-4 h-4" />
          Manuell eingeben
        </button>
      )}

      <AnimatePresence>
        {scannedCode && !isManualMode && (
          <motion.div
            key="result"
            initial={{ y: 220, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 220, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-0 inset-x-0 z-30 bg-black/90 backdrop-blur-xl rounded-t-3xl p-6 border-t border-white/10"
          >
            {successMsg ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <p className="text-white font-bold text-lg">{successMsg}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white/60 text-sm uppercase tracking-widest">Sticker erkannt</span>
                </div>
                <p className="text-3xl font-bold text-white font-mono mb-1">{scannedCode}</p>
                <p className="text-white/60 text-sm mb-4">{getStickerName(scannedCode)}</p>
                {profile.owned.includes(scannedCode) && (
                  <p className="text-amber-400 text-xs mb-3">Bereits vorhanden – wird als Duplikat gezählt</p>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setScannedCode(null)}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2">
                    <RefreshCcw className="w-4 h-4" />
                    Weiter
                  </button>
                  <button onClick={handleConfirmAdd}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Hinzufügen
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isManualMode && (
          <motion.div
            key="manual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center px-6"
          >
            <div className="w-full max-w-sm bg-white/10 rounded-2xl p-6 border border-white/20">
              <h2 className="text-white font-bold text-xl mb-4 text-center">Code eingeben</h2>
              {manualError && <p className="text-red-400 text-sm text-center mb-2">{manualError}</p>}
              <input
                type="text"
                value={manualCode}
                onChange={e => { setManualCode(e.target.value.toUpperCase()); setManualError(""); }}
                onKeyDown={e => e.key === "Enter" && handleManualSubmit()}
                placeholder="z.B. GER10"
                className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-2xl font-mono text-center placeholder-white/30 focus:outline-none focus:border-indigo-500 mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => { setIsManualMode(false); setManualError(""); }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium">
                  Abbrechen
                </button>
                <button onClick={handleManualSubmit}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold">
                  OK
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
