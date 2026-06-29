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
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [ocrPreview, setOcrPreview]   = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode]   = useState('');
  const [manualError, setManualError] = useState('');
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  const allKnownCodes = getAllStickerCodes().sort((a, b) => b.length - a.length);

    const extractCode = (rawText: string): string | null => {
    let upper = rawText.toUpperCase();
    
    // Tesseract often reads '1' as 'I' or 'l' or '|' when it's next to letters.
    // e.g. "SUI I", "GER l", "FRA |"
    upper = upper.replace(/([A-Z]{3})\s*[IL|]/g, '$1 1');
    upper = upper.replace(/([A-Z]{3})\s*O/g, '$1 0');
    
    upper = upper.replace(/[^A-Z0-9\n ]/g, ' ');

    const patternRegex = /\b([A-Z]{2,4})\s*(\d{1,2})\b/g;
    const candidates: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = patternRegex.exec(upper)) !== null) {
      candidates.push(m[1] + m[2]);
    }
    for (const candidate of candidates) {
      const compact = candidate.replace(/\s/g, '');
      for (const code of allKnownCodes) {
        if (code.toUpperCase().replace(/\s/g, '') === compact) return code;
      }
    }
    const tokens = upper.split(/\s+/).filter(t => t.length > 0);
    for (const code of allKnownCodes) {
      const c = code.toUpperCase().replace(/\s/g, '');
      if (tokens.includes(c)) return code;
      for (let i = 0; i < tokens.length - 1; i++) {
        if (tokens[i] + tokens[i + 1] === c) return code;
      }
    }
    
    // Final fallback: just look if the exact code without spaces appears anywhere in the raw text without spaces
    const noSpaceText = upper.replace(/\s/g, '');
    for (const code of allKnownCodes) {
      const c = code.toUpperCase().replace(/\s/g, '');
      // Only do this for codes that have numbers, to avoid matching "GER" by accident
      if (c.length >= 4 && noSpaceText.includes(c)) return code;
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
        await w.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT });
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

      // NO CROPPING (to avoid EXIF rotation issues on iOS).
      // Instead, we scale down the whole image to max 1200px and apply a high-contrast B&W filter
      // so Tesseract can easily read the bright text on the dark sticker background.
      const maxDim = 1200;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }

      const processCanvas = document.createElement('canvas');
      processCanvas.width = w;
      processCanvas.height = h;
      const ctx = processCanvas.getContext('2d')!;
      
      // High contrast and grayscale to make text pop
      ctx.filter = 'grayscale(100%) invert(100%) contrast(300%) brightness(150%)';
      ctx.drawImage(img, 0, 0, w, h);

      const blob = await new Promise<Blob>((res) => processCanvas.toBlob(b => res(b!), 'image/jpeg', 0.95));
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
                <img src={capturedUrl} alt="Foto" className="w-full object-cover" />
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
                  <img src={capturedUrl} alt="Foto" className="w-full object-cover opacity-60" />
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
                  <img src={capturedUrl} alt="Foto" className="w-full object-cover" />
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