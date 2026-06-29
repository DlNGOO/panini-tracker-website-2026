import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Edit2, CheckCircle, RefreshCcw, Camera } from 'lucide-react';
import Tesseract, { createWorker } from 'tesseract.js';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, getAllStickerCodes } from '../types';
import { getStickerName } from '../playerData';

interface StickerScannerProps {
  onClose: () => void;
  profile: UserProfile;
  onUpdateInventory: (owned: string[], duplicates: Record<string, number>) => void;
}

export default function StickerScanner({ onClose, profile, onUpdateInventory }: StickerScannerProps) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const hiddenCanvas  = useRef<HTMLCanvasElement>(null);
  const overlayCanvas = useRef<HTMLCanvasElement>(null);
  const workerRef     = useRef<Tesseract.Worker | null>(null);
  const trackRef      = useRef<MediaStreamVideoTrack | null>(null);

  const [ready, setReady]             = useState(false);
  const [scanning, setScanning]       = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [ocrLog, setOcrLog]           = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode]   = useState('');
  const [manualError, setManualError] = useState('');
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  const allKnownCodes = getAllStickerCodes().sort((a, b) => b.length - a.length);

  // Pattern-first extraction: sticker codes = 2-4 letters + optional space + 1-2 digits
  const extractCode = (text: string): string | null => {
    const upper = text.toUpperCase().replace(/[^A-Z0-9\n ]/g, ' ');
    const patternRegex = /\b([A-Z]{2,4})\s*(\d{1,2})\b/g;
    const candidates: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = patternRegex.exec(upper)) !== null) {
      candidates.push(m[1] + m[2]);
    }
    for (const candidate of candidates) {
      const compact = candidate.replace(/\s/g, '').toUpperCase();
      for (const code of allKnownCodes) {
        if (code.toUpperCase().replace(/\s/g, '') === compact) return code;
      }
    }
    // Fallback: token matching
    const tokens = upper.split(/\s+/).filter(t => t.length > 0);
    for (const code of allKnownCodes) {
      const c = code.toUpperCase().replace(/\s/g, '');
      if (tokens.includes(c)) return code;
      for (let i = 0; i < tokens.length - 1; i++) {
        if (tokens[i] + tokens[i + 1] === c) return code;
      }
    }
    return null;
  };

  const drawBoxes = useCallback((words: Tesseract.Word[], vw: number, vh: number) => {
    const oc  = overlayCanvas.current;
    const vid = videoRef.current;
    if (!oc || !vid) return;
    oc.width  = vid.clientWidth;
    oc.height = vid.clientHeight;
    const sx = oc.width  / (vw || 1);
    const sy = oc.height / (vh || 1);
    const ctx = oc.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, oc.width, oc.height);
    for (const w of words) {
      const { x0, y0, x1, y1 } = w.bbox;
      // Map crop coords back to full video coords (crop was right half, top 40%)
      const fullW = (oc.width / sx);
      const fullH = (oc.height / sy);
      const cropOffX = fullW * 0.50;
      const scaleCanvas = 2; // we upscaled 2x
      const rx = (x0 / scaleCanvas + cropOffX) * sx;
      const ry = (y0 / scaleCanvas) * sy;
      const rw = ((x1 - x0) / scaleCanvas) * sx;
      const rh = ((y1 - y0) / scaleCanvas) * sy;
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth   = 3;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur  = 10;
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(w.text, rx + 2, Math.max(ry - 4, 12));
      ctx.restore();
    }
  }, []);

  const clearOverlay = useCallback(() => {
    const oc  = overlayCanvas.current;
    const vid = videoRef.current;
    if (!oc || !vid) return;
    oc.width  = vid.clientWidth;
    oc.height = vid.clientHeight;
    oc.getContext('2d')?.clearRect(0, 0, oc.width, oc.height);
  }, []);

  // Grab the top-right 50% x top-40% of the video frame (where the code is)
  const grabTopRight = useCallback(async (): Promise<{ ok: boolean; w: number; h: number }> => {
    const hc  = hiddenCanvas.current;
    const vid = videoRef.current;
    if (!hc || !vid) return { ok: false, w: 0, h: 0 };
    let srcBitmap: ImageBitmap | null = null;
    if (trackRef.current && typeof (window as any).ImageCapture !== 'undefined') {
      try {
        const ic  = new (window as any).ImageCapture(trackRef.current);
        srcBitmap = await ic.grabFrame() as ImageBitmap;
      } catch { /* fall through */ }
    }
    const fullW = srcBitmap ? srcBitmap.width  : (vid.videoWidth  || vid.clientWidth  || 0);
    const fullH = srcBitmap ? srcBitmap.height : (vid.videoHeight || vid.clientHeight || 0);
    if (!fullW) return { ok: false, w: 0, h: 0 };
    const cropX = Math.round(fullW * 0.50);
    const cropY = 0;
    const cropW = Math.round(fullW * 0.50);
    const cropH = Math.round(fullH * 0.40);
    hc.width  = cropW * 2;
    hc.height = cropH * 2;
    const ctx = hc.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { ok: false, w: 0, h: 0 };
    if (srcBitmap) {
      ctx.drawImage(srcBitmap, cropX, cropY, cropW, cropH, 0, 0, hc.width, hc.height);
      srcBitmap.close();
    } else {
      ctx.drawImage(vid, cropX, cropY, cropW, cropH, 0, 0, hc.width, hc.height);
    }
    return { ok: true, w: hc.width, h: hc.height };
  }, []);

  // On-demand scan triggered by shutter button
  const handleShutter = useCallback(async () => {
    if (scanning || !workerRef.current) return;
    setScanning(true);
    setOcrLog('Analysiere...');
    setScannedCode(null);
    clearOverlay();
    try {
      const { ok, w, h } = await grabTopRight();
      if (!ok) { setOcrLog('Kein Bild'); return; }
      const hc = hiddenCanvas.current!;
      const { data } = await workerRef.current.recognize(hc);
      const code = extractCode(data.text);
      if (code) {
        const codeUpper = code.toUpperCase().replace(/\s/g, '');
        const matchedWords = data.words.filter(w => {
          const wc = w.text.toUpperCase().replace(/[^A-Z0-9]/g, '');
          return wc.length >= 1 && codeUpper.includes(wc);
        });
        drawBoxes(matchedWords, w, h);
        setScannedCode(code);
        setOcrLog('');
      } else {
        setOcrLog('Nicht erkannt — nochmal versuchen');
        setTimeout(() => setOcrLog(''), 2500);
      }
    } catch {
      setOcrLog('Fehler beim Scannen');
      setTimeout(() => setOcrLog(''), 2000);
    } finally {
      setScanning(false);
    }
  }, [scanning, clearOverlay, grabTopRight, drawBoxes]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let alive = true;
    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
        trackRef.current = stream.getVideoTracks()[0] as MediaStreamVideoTrack;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      } catch { /* camera unavailable */ }
      try {
        const w = await createWorker('eng', 1, {
          langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast',
        });
        if (!alive) { w.terminate(); return; }
        await w.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT });
        workerRef.current = w;
        setReady(true);
      } catch { /* worker failed */ }
    };
    init();
    return () => { alive = false; stream?.getTracks().forEach(t => t.stop()); workerRef.current?.terminate(); };
  }, []);

  const handleConfirmAdd = () => {
    if (!scannedCode) return;
    const newOwned = [...profile.owned];
    const newDuplicates = { ...profile.duplicates };
    if (newOwned.includes(scannedCode)) {
      newDuplicates[scannedCode] = (newDuplicates[scannedCode] || 1) + 1;
      setSuccessMsg('Duplikat ' + scannedCode + ' gespeichert');
    } else {
      newOwned.push(scannedCode);
      setSuccessMsg(scannedCode + ' hinzugefuegt!');
    }
    onUpdateInventory(newOwned, newDuplicates);
    setTimeout(() => { setSuccessMsg(null); setScannedCode(null); clearOverlay(); }, 1800);
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim().toUpperCase();
    if (!allKnownCodes.includes(code)) { setManualError('"' + code + '" nicht gefunden.'); return; }
    setScannedCode(code); setIsManualMode(false); setManualError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 w-full h-full object-cover" />

      {/* Top-right zone indicator */}
      <div className="absolute top-0 right-0 w-1/2 h-2/5 border-2 border-dashed border-white/30 pointer-events-none">
        <span className="absolute top-2 left-2 text-white/50 text-[10px] uppercase tracking-widest font-mono">Code hier</span>
      </div>

      <canvas ref={overlayCanvas} className="absolute inset-0 w-full h-full pointer-events-none" />
      <canvas ref={hiddenCanvas} className="hidden" />

      <button onClick={onClose} className="absolute top-4 left-4 z-30 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm">
        <X className="w-5 h-5" />
      </button>

      {ocrLog && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/70 px-4 py-2 rounded-full text-white text-sm font-mono backdrop-blur-sm">{ocrLog}</div>
      )}

      {/* Bottom controls */}
      {!scannedCode && !isManualMode && (
        <div className="absolute bottom-0 inset-x-0 z-30 flex flex-col items-center gap-3 pb-10 pt-6 bg-gradient-to-t from-black/80 to-transparent">
          <button id="shutter-btn" onClick={handleShutter} disabled={!ready || scanning}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 backdrop-blur-sm"
            style={{ background: scanning ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.15)' }}>
            {scanning
              ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Camera className="w-8 h-8 text-white" />
            }
          </button>
          <p className="text-white/50 text-xs text-center px-6">
            {ready ? 'Code in die obere rechte Ecke halten, dann drücken' : 'Startet...'} 
          </p>
          <button onClick={() => setIsManualMode(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 text-white/60 text-sm border border-white/15">
            <Edit2 className="w-3.5 h-3.5" />
            Manuell eingeben
          </button>
        </div>
      )}

      <AnimatePresence>
        {scannedCode && !isManualMode && (
          <motion.div key="result"
            initial={{ y: 220, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 220, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-xl rounded-t-3xl p-6 border-t border-white/10">
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
                  <button onClick={() => { setScannedCode(null); clearOverlay(); }}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2">
                    <RefreshCcw className="w-4 h-4" />
                    Nochmal
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
          <motion.div key="manual"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center px-6">
            <div className="w-full max-w-sm bg-white/10 rounded-2xl p-6 border border-white/20">
              <h2 className="text-white font-bold text-xl mb-4 text-center">Code eingeben</h2>
              {manualError && <p className="text-red-400 text-sm text-center mb-2">{manualError}</p>}
              <input type="text" value={manualCode}
                onChange={e => { setManualCode(e.target.value.toUpperCase()); setManualError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                placeholder="z.B. GER10"
                className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-2xl font-mono text-center placeholder-white/30 focus:outline-none focus:border-indigo-500 mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => { setIsManualMode(false); setManualError(''); }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium">Abbrechen</button>
                <button onClick={handleManualSubmit}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold">OK</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}