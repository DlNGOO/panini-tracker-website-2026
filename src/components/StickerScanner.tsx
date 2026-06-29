import React, { useRef, useState, useEffect } from 'react';
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
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const workerRef     = useRef<Tesseract.Worker | null>(null);

  const [workerReady, setWorkerReady] = useState(false);
  const [status, setStatus] = useState<'idle'|'scanning'|'done'|'error'>('idle');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [debugCropUrl, setDebugCropUrl] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [ocrPreview, setOcrPreview]   = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode]   = useState('');
  const [manualError, setManualError] = useState('');
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  const allKnownCodes = getAllStickerCodes().sort((a, b) => b.length - a.length);

      const extractCode = (rawText: string): string | null => {
    let upper = rawText.toUpperCase();
    
    // Fix common OCR errors where '1' or '0' is misread as letters AFTER a country code
    upper = upper.replace(/([A-Z]{2,4})\s*[IL|]/g, '$1 1');
    upper = upper.replace(/([A-Z]{2,4})\s*O/g, '$1 0');
    
    // Keep only letters, numbers, and spaces
    upper = upper.replace(/[^A-Z0-9\n ]/g, ' ');

    // 1. Strict Regex: requires word boundaries (prevents PANINI -> PAN1N1 -> matching PAN1)
    const strictRegex = /\b([A-Z]{2,4})\s*(\d{1,2})\b/g;
    const candidates: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = strictRegex.exec(upper)) !== null) {
      candidates.push((m[1] + m[2]).replace(/\s/g, ''));
    }

    // 2. Loose Regex: if strict failed, try without boundaries, but CAREFUL with PAN1
    if (candidates.length === 0) {
      const looseRegex = /([A-Z]{2,4})\s*(\d{1,2})/g;
      while ((m = looseRegex.exec(upper)) !== null) {
        candidates.push((m[1] + m[2]).replace(/\s/g, ''));
      }
    }

    // Validate candidates against the database of all known codes
    const validMatches: string[] = [];
    for (const candidate of candidates) {
      for (const known of allKnownCodes) {
        if (known.toUpperCase().replace(/\s/g, '') === candidate) {
          validMatches.push(known);
          break;
        }
      }
    }

    if (validMatches.length > 0) {
      // MASSIVE FIX: The word "PANINI" is printed on the bottom of EVERY sticker.
      // If the OCR reads "PANINI" as "PAN1N1", it might trigger the code "PAN 1".
      // We filter out PAN1 if another valid code (like SUI 1) was also found.
      const withoutPan = validMatches.filter(c => c.replace(/\s/g, '') !== 'PAN1');
      if (withoutPan.length > 0) {
        return withoutPan[0]; 
      }
      // If ONLY PAN 1 was found, we return it (but only if strict regex matched, to be safe)
      return validMatches[0];
    }

    return null;
  };

  useEffect(() => {
    let alive = true;
    const init = async () => {
      try {
        const w = await createWorker('eng', 1, {
          langPath: 'https://tessdata.projectnaptha.com/4.0.0_fast',
        });
        if (!alive) { w.terminate(); return; }
        await w.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK });
        workerRef.current = w;
        setWorkerReady(true);
      } catch { /* ignore */ }
    };
    init();
    return () => { alive = false; workerRef.current?.terminate(); };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workerRef.current) return;

    const url = URL.createObjectURL(file);
    setCapturedUrl(url);
    setStatus('scanning');
    setOcrPreview('');
    setScannedCode(null);

    try {
      const img = new Image();
      img.src = url;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });

      // Step 1: Draw the image exactly as the browser renders it (respecting EXIF)
      // We use a fixed maximum size to avoid memory crashes on huge phone photos
      const MAX_SIZE = 1200;
      let drawW = img.width || img.naturalWidth;
      let drawH = img.height || img.naturalHeight;
      
      if (drawW > MAX_SIZE || drawH > MAX_SIZE) {
        if (drawW > drawH) { drawH = Math.round((drawH * MAX_SIZE) / drawW); drawW = MAX_SIZE; }
        else { drawW = Math.round((drawW * MAX_SIZE) / drawH); drawH = MAX_SIZE; }
      }

      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = drawW;
      baseCanvas.height = drawH;
      const baseCtx = baseCanvas.getContext('2d')!;
      baseCtx.drawImage(img, 0, 0, drawW, drawH);

      // Step 2: CROP ONLY THE TOP RIGHT CORNER (User strictly requested this!)
      // Right 40%, Top 30%
      const cropW = Math.round(drawW * 0.45);
      const cropH = Math.round(drawH * 0.35);
      const cropX = drawW - cropW;
      const cropY = 0;

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext('2d')!;

      // Step 3: Apply filter: invert (because sticker code is white on dark), high contrast
      cropCtx.filter = 'grayscale(100%) invert(100%) contrast(300%) brightness(150%)';
      cropCtx.drawImage(baseCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const blob = await new Promise<Blob>((res) => cropCanvas.toBlob(b => res(b!), 'image/jpeg', 0.95));
      const { data } = await workerRef.current.recognize(blob);

      const rawText = data.text.replace(/\n/g, ' ').trim();
      setOcrPreview(rawText.substring(0, 100));

      const code = extractCode(data.text);
      if (code) {
        setScannedCode(code);
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRetry = () => {
    setStatus('idle');
    setCapturedUrl(null);
    setScannedCode(null);
    setOcrPreview('');
  };

  const handleConfirmAdd = () => {
    if (!scannedCode) return;
    const newOwned = [...profile.owned];
    const newDup   = { ...profile.duplicates };
    if (newOwned.includes(scannedCode)) {
      newDup[scannedCode] = (newDup[scannedCode] || 1) + 1;
      setSuccessMsg('Duplikat ' + scannedCode + ' gespeichert');
    } else {
      newOwned.push(scannedCode);
      setSuccessMsg(scannedCode + ' hinzugefuegt! ');
    }
    onUpdateInventory(newOwned, newDup);
    setTimeout(() => { setSuccessMsg(null); handleRetry(); }, 1800);
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim().toUpperCase();
    if (!allKnownCodes.includes(code)) { setManualError('"' + code + '" nicht gefunden.'); return; }
    setScannedCode(code); setIsManualMode(false); setManualError('');
    setStatus('done'); setCapturedUrl(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-y-auto">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
        onChange={handleFileChange} className="hidden" />

      <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-slate-950/90 backdrop-blur-sm border-b border-white/5 z-10">
        <span className="text-white font-bold text-base">Sticker scannen</span>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-white"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5 py-8">
        <AnimatePresence mode="wait">
          {status === 'idle' && !isManualMode && (
            <motion.div key="idle"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full max-w-xs">

              <div className="relative w-56 h-36 rounded-2xl border-2 border-dashed border-indigo-500/40 bg-white/5 flex items-center justify-center overflow-hidden">
                <span className="text-white/20 text-xs uppercase tracking-widest">Sticker</span>
                <div className="absolute top-2 right-2 border-2 border-indigo-400 rounded-lg px-1.5 py-0.5 animate-pulse">
                  <span className="text-indigo-300 text-[11px] font-mono font-bold">SUI 1</span>
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-[9px] text-white/30 uppercase tracking-widest">Gut beleuchtet fotografieren</span>
                </div>
              </div>

              <p className="text-white/50 text-sm text-center leading-relaxed">
                Mache ein <strong className="text-indigo-400">scharfes Foto</strong> vom gesamten Sticker.
                Das System sucht automatisch nach dem Code.
              </p>

              <p className="text-[11px] font-mono text-white/25">{workerReady ? 'Bereit' : 'Laedt...'}</p>

              <button onClick={() => fileInputRef.current?.click()}
                disabled={!workerReady}
                className="w-24 h-24 rounded-full border-4 border-white/80 bg-white/10 flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 shadow-2xl shadow-indigo-900/40">
                <Camera className="w-10 h-10 text-white" />
              </button>

              <button onClick={() => setIsManualMode(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/50 text-sm border border-white/10">
                <Edit2 className="w-3.5 h-3.5" />
                Manuell eingeben
              </button>
            </motion.div>
          )}

          {status === 'scanning' && capturedUrl && (
            <motion.div key="scanning"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full max-w-xs">
              <div className="relative w-full rounded-2xl overflow-hidden border border-white/10">
                <img src={debugCropUrl || capturedUrl} alt="Foto" className="w-full object-contain bg-slate-900 max-h-48" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-black/80 rounded-xl px-5 py-4 text-center">
                    <div className="w-7 h-7 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-white text-sm">Analysiere Foto...</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div key="error"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full max-w-xs">
              {capturedUrl && (
                <div className="relative w-full rounded-2xl overflow-hidden border border-red-500/30">
                  <img src={debugCropUrl || capturedUrl} alt="Foto" className="w-full object-contain bg-slate-900 max-h-48 opacity-60" />
                </div>
              )}
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-center w-full">
                <p className="text-red-300 text-sm font-bold mb-1">Code nicht erkannt</p>
                {ocrPreview ? (
                  <p className="text-red-300/70 text-xs">Gelesen: &quot;{ocrPreview}&quot;</p>
                ) : (
                  <p className="text-red-300/70 text-xs">Bitte schärfer fotografieren oder manuell eingeben.</p>
                )}
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 active:scale-95">
                  <Camera className="w-4 h-4" />
                  Nochmal fotografieren
                </button>
                <button onClick={() => { setIsManualMode(true); handleRetry(); }}
                  className="w-full py-3 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2 active:scale-95">
                  <Edit2 className="w-4 h-4" />
                  Manuell eingeben
                </button>
              </div>
            </motion.div>
          )}

          {status === 'done' && scannedCode && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full max-w-xs">
              {capturedUrl && (
                <div className="relative w-full rounded-2xl overflow-hidden border-2 border-emerald-500/50">
                  <img src={debugCropUrl || capturedUrl} alt="Foto" className="w-full object-contain bg-slate-900 max-h-48" />
                </div>
              )}
              {successMsg ? (
                <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-5 text-center w-full">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-300 font-bold">{successMsg}</p>
                </div>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white font-mono">{scannedCode}</p>
                    <p className="text-white/60 text-sm mt-1">{getStickerName(scannedCode)}</p>
                    {profile.owned.includes(scannedCode) && (
                      <p className="text-amber-400 text-xs mt-1">Bereits vorhanden – Duplikat</p>
                    )}
                  </div>
                  <div className="flex gap-3 w-full">
                    <button onClick={handleRetry}
                      className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium flex items-center justify-center gap-2">
                      <RefreshCcw className="w-4 h-4" />
                      Nochmal
                    </button>
                    <button onClick={handleConfirmAdd}
                      className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Hinzufuegen
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {isManualMode && (
            <motion.div key="manual"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5 w-full max-w-xs">
              <h2 className="text-white font-bold text-xl">Code eingeben</h2>
              <p className="text-white/40 text-sm text-center">z.B. <span className="text-indigo-400 font-mono">GER10</span> oder <span className="text-indigo-400 font-mono">SUI1</span></p>
              {manualError && <p className="text-red-400 text-sm text-center">{manualError}</p>}
              <input type="text" value={manualCode}
                onChange={e => { setManualCode(e.target.value.toUpperCase()); setManualError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                placeholder="z.B. GER10"
                className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-2xl font-mono text-center placeholder-white/30 focus:outline-none focus:border-indigo-500"
                autoFocus />
              <div className="flex gap-3 w-full">
                <button onClick={() => { setIsManualMode(false); setManualError(''); }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium">Abbrechen</button>
                <button onClick={handleManualSubmit}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold">OK</button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}