import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Camera as CameraIcon, CheckCircle, RefreshCcw, Edit2 } from "lucide-react";
import { createWorker } from "tesseract.js";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, getAllStickerCodes, parseStickerCode } from "../types";
import { getStickerName } from "../playerData";

interface StickerScannerProps {
  onClose: () => void;
  profile: UserProfile;
  onUpdateInventory: (owned: string[], duplicates: Record<string, number>) => void;
}

export default function StickerScanner({ onClose, profile, onUpdateInventory }: StickerScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scannedBox, setScannedBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  
  // Store crop coordinates for bounding box calculation
  const [cropData, setCropData] = useState<{ x: number; y: number; scale: number } | null>(null);

  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>("Initialisiere...");

  // Stop media tracks when component unmounts
  const stopMediaTracks = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    let worker: Tesseract.Worker | null = null;
    let scanInterval: ReturnType<typeof setInterval>;
    
    // Sort codes by length descending so we match "GER10" before "GER1"
    const allKnownCodes = getAllStickerCodes().sort((a, b) => b.length - a.length);
    
    // Format detected string into a possible sticker code
    const extractStickerCode = (text: string): string | null => {
      // Remove all spaces, punctuation, and newlines
      let cleanText = text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      
      // Common OCR mistakes correction
      cleanText = cleanText.replace(/0/g, "O").replace(/O/g, "0"); // Numbers vs Letters
      // It's hard to safely replace 1/I/L globally, but let's just look for substring matches
      
      // Find the first (longest) code that is in the text
      for (const code of allKnownCodes) {
        // Tesseract sometimes sees 'O' instead of '0', so let's normalize the code we're looking for too
        const normalizedCode = code.replace(/O/g, "0");
        
        if (cleanText.includes(normalizedCode)) {
          return code;
        }
      }
      return null;
    };

    const initScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready before starting OCR
          videoRef.current.onloadedmetadata = async () => {
            if (videoRef.current) {
              videoRef.current.play();
              setIsLoading(false);
              
              // Init Tesseract with logger to track progress
              worker = await createWorker('eng', 1, {
                logger: m => {
                  if (m.status === "recognizing text") {
                    setOcrStatus(`Analysiere... ${Math.round(m.progress * 100)}%`);
                  } else {
                    // Translate common Tesseract statuses to German
                    let statusDe = m.status;
                    if (m.status.includes("loading")) statusDe = "Lade Scanner-Engine...";
                    if (m.status.includes("initializing")) statusDe = "Starte Scanner...";
                    if (m.status.includes("downloading")) statusDe = "Lade Sprachmodell...";
                    setOcrStatus(statusDe);
                  }
                }
              });
              await worker.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT
              });
              
              // Start interval scanning
              scanInterval = setInterval(async () => {
                if (isRecognizing || scannedCode || isManualMode) return; // wait for user interaction or current scan
                
                const video = videoRef.current;
                // Ensure we have dimensions to draw
                const w = video.videoWidth || video.clientWidth || 640;
                const h = video.videoHeight || video.clientHeight || 480;
                
                if (w === 0 || h === 0) return;

                // Draw FULL video to the hidden canvas
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.drawImage(video, 0, 0, w, h);

                // Show the FULL image in the debug canvas (scaled down) to guarantee we see if drawing works
                const debugCanvas = document.getElementById("debug-canvas") as HTMLCanvasElement;
                if (debugCanvas) {
                   debugCanvas.width = 100;
                   debugCanvas.height = 150;
                   const debugCtx = debugCanvas.getContext("2d");
                   if (debugCtx) {
                      debugCtx.drawImage(canvas, 0, 0, 100, 150);
                   }
                }
                
                // Do OCR on the ENTIRE frame using SPARSE_TEXT (finds text anywhere)
                try {
                  setIsRecognizing(true);
                  const { data } = await worker!.recognize(canvas);
                  
                  // Look for valid codes in the text
                  const code = extractStickerCode(data.text);
                  
                  if (code) {
                    setScannedCode(code);
                    
                    // We don't need bounding boxes anymore since we removed the crop math.
                    // The reticle simply turns green.
                  }
                } catch (e) {
                  console.error("OCR Error:", e);
                } finally {
                  setIsRecognizing(false);
                }
              }, 1500); // scan every 1.5s
            }
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setErrorMsg("Kamera-Zugriff verweigert oder nicht verfügbar.");
        setIsLoading(false);
      }
    };

    initScanner();

    return () => {
      stopMediaTracks();
      clearInterval(scanInterval);
      if (worker) {
        worker.terminate();
      }
    };
  }, [scannedCode, isRecognizing, isManualMode]);

  // No overlay canvas needed anymore since we just turn the reticle green
  useEffect(() => {
    // keeping effect for consistency but empty since we removed overlay box drawing
  }, []);

  const handleAddSticker = (codeToAdd: string) => {
    const parsed = parseStickerCode(codeToAdd);
    if (!parsed) {
      setErrorMsg("Ungültiger Sticker-Code!");
      return;
    }
    
    const newOwned = [...profile.owned];
    const newDuplicates = { ...profile.duplicates };
    
    if (newOwned.includes(codeToAdd)) {
      newDuplicates[codeToAdd] = (newDuplicates[codeToAdd] || 0) + 1;
      setSuccessMsg(`${codeToAdd} als DOPPELT eingetragen (+${newDuplicates[codeToAdd]})`);
    } else {
      newOwned.push(codeToAdd);
      setSuccessMsg(`${codeToAdd} zum Album hinzugefügt!`);
    }
    
    onUpdateInventory(newOwned, newDuplicates);
    
    // Reset scanner for next sticker after 1.5s
    setTimeout(() => {
      setSuccessMsg(null);
      handleResumeScanning();
    }, 1500);
  };

  const handleResumeScanning = () => {
    setScannedCode(null);
    setIsManualMode(false);
    setManualCode("");
    setErrorMsg(null);
    
    // Clear the debug canvas
    const debugCanvas = document.getElementById("debug-canvas") as HTMLCanvasElement;
    if (debugCanvas) {
       const dCtx = debugCanvas.getContext("2d");
       if (dCtx) dCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Hidden canvas for OCR processing (using opacity-0 instead of hidden for iOS support) */}
      <canvas ref={canvasRef} className="absolute opacity-0 pointer-events-none" />
      
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <CameraIcon className="h-5 w-5 text-indigo-400" />
          <span className="font-bold tracking-wider">STICKER-SCANNER</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Camera Container */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 z-10">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-mono animate-pulse">Kamera wird initialisiert...</p>
          </div>
        )}
        
        {errorMsg && !isLoading && (
          <div className="absolute inset-x-4 top-20 bg-rose-500/20 border border-rose-500/50 p-4 rounded-xl text-rose-400 text-sm text-center z-20">
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute top-1/3 inset-x-8 bg-emerald-500 border border-emerald-400 p-4 rounded-2xl text-white text-center z-30 shadow-2xl shadow-emerald-500/20"
          >
            <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-90" />
            <h3 className="font-black text-lg">{successMsg}</h3>
          </motion.div>
        )}

        {/* Video feed */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Target Reticle */}
        {!isManualMode && !isLoading && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className={`w-56 h-72 border-2 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-colors duration-300 ${scannedCode ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/30'}`}>
              {/* Corner brackets */}
              <div className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-xl transition-colors duration-300 ${scannedCode ? 'border-emerald-400' : 'border-indigo-500'}`}></div>
              <div className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 rounded-tr-xl transition-colors duration-300 ${scannedCode ? 'border-emerald-400' : 'border-indigo-500'}`}></div>
              <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 rounded-bl-xl transition-colors duration-300 ${scannedCode ? 'border-emerald-400' : 'border-indigo-500'}`}></div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-xl transition-colors duration-300 ${scannedCode ? 'border-emerald-400' : 'border-indigo-500'}`}></div>
              
              {!scannedCode && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                   <p className="text-white/60 text-xs font-bold tracking-wider mb-1 uppercase">Sticker scannen</p>
                   <p className="text-white/40 text-[10px] leading-tight">Nummer oben rechts<br/>im Rahmen platzieren</p>
                </div>
              )}
              {scannedCode && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                   <CheckCircle className="h-12 w-12 text-emerald-400 opacity-80" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug Canvas: Shows exactly what Tesseract is seeing */}
        {!isManualMode && (
          <div className="absolute top-20 left-4 z-20 flex flex-col gap-1 pointer-events-none opacity-80">
            <span className="text-[9px] text-white uppercase tracking-widest font-mono">Kamera-Feed:</span>
            <canvas id="debug-canvas" className="w-16 h-24 border border-indigo-500/50 rounded-lg bg-black shadow-2xl object-cover" />
          </div>
        )}

        {/* Scanning Indicator / Logger */}
        {!scannedCode && (
           <div className="absolute top-24 right-4 bg-indigo-600/90 backdrop-blur-md px-4 py-2 rounded-xl text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 z-20 shadow-xl border border-indigo-500/50 max-w-[200px] text-right">
             <div className="w-2 h-2 bg-white rounded-full animate-ping flex-shrink-0"></div> 
             <span className="truncate">{ocrStatus}</span>
           </div>
        )}
      </div>

      {/* Bottom Panel (Controls / Action UI) */}
      <AnimatePresence>
        {scannedCode && !successMsg && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 p-6 rounded-t-3xl z-40 shadow-2xl"
          >
            <div className="text-center mb-6">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-2">Sticker erkannt</p>
              <h2 className="text-5xl font-black font-mono text-white mb-2">{scannedCode}</h2>
              <p className="text-emerald-400 text-sm">{getStickerName(scannedCode)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAddSticker(scannedCode)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl flex flex-col items-center gap-1 shadow-lg shadow-indigo-500/20"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Eintragen</span>
              </button>
              
              <div className="grid grid-rows-2 gap-3">
                <button
                  onClick={handleResumeScanning}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl flex items-center justify-center gap-2 text-xs"
                >
                  <RefreshCcw className="h-3.5 w-3.5" /> Neu Scannen
                </button>
                <button
                  onClick={() => setIsManualMode(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl flex items-center justify-center gap-2 text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Manuelle Eingabe
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {isManualMode && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 p-6 rounded-t-3xl z-40 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">Sticker manuell eintragen</h3>
              <button onClick={handleResumeScanning} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="z.B. GER 10"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-xl text-center mb-4 focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            
            <button
              onClick={() => handleAddSticker(manualCode.replace(/\s+/g, ""))}
              disabled={!manualCode}
              className="w-full bg-indigo-600 disabled:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg"
            >
              Speichern
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
