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
  
  const [scannedBox, setScannedBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  
  // Store crop coordinates for bounding box calculation
  const [cropData, setCropData] = useState<{ x: number; y: number; scale: number } | null>(null);

  const [isManualMode, setIsManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
    
    // Validate string against known codes
    const allKnownCodes = getAllStickerCodes();
    
    // Format detected string into a possible sticker code
    // E.g. "BIH 2" -> "BIH2", "GER 10" -> "GER10", "Fwc00" -> "FWC00"
    const extractStickerCode = (text: string): string | null => {
      // Find possible patterns like 3 letters followed by numbers
      const matches = text.toUpperCase().match(/[A-Z]{3}\s*\d{1,2}/g);
      if (!matches) return null;
      
      for (const m of matches) {
        const clean = m.replace(/\s+/g, "");
        if (allKnownCodes.includes(clean)) {
          return clean;
        }
      }
      return null;
    };

    const initScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to be ready before starting OCR
          videoRef.current.onloadedmetadata = async () => {
            if (videoRef.current) {
              videoRef.current.play();
              setIsLoading(false);
              
              // Init Tesseract
              worker = await createWorker('eng');
              
              // Start interval scanning
              scanInterval = setInterval(async () => {
                if (isRecognizing || scannedCode || isManualMode) return; // wait for user interaction or current scan
                
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (!video || !canvas) return;

                // Crop the video to the reticle area for better and faster OCR
                // Reticle size: w-56 h-72 = 14rem x 18rem = 224px x 288px
                const reticleClientW = 224;
                const reticleClientH = 288;
                
                const scaleX = video.videoWidth / video.clientWidth;
                const scaleY = video.videoHeight / video.clientHeight;
                
                const reticleVideoW = reticleClientW * scaleX;
                const reticleVideoH = reticleClientH * scaleY;
                
                const reticleVideoX = (video.videoWidth - reticleVideoW) / 2;
                const reticleVideoY = (video.videoHeight - reticleVideoH) / 2;
                
                // Scale up the cropped area to improve OCR of small text
                const scaleForOCR = 2;
                canvas.width = reticleVideoW * scaleForOCR;
                canvas.height = reticleVideoH * scaleForOCR;
                
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                
                ctx.drawImage(
                  video,
                  reticleVideoX, reticleVideoY, reticleVideoW, reticleVideoH,
                  0, 0, canvas.width, canvas.height
                );
                
                // Do OCR on the cropped and magnified canvas
                try {
                  setIsRecognizing(true);
                  const { data } = await worker!.recognize(canvas);
                  
                  // Look for valid codes in the text
                  const code = extractStickerCode(data.text);
                  
                  if (code) {
                    setScannedCode(code);
                    setCropData({ x: reticleVideoX, y: reticleVideoY, scale: scaleForOCR });
                    
                    // Find bounding box for drawing overlay
                    let boxFound = false;
                    for (const block of data.blocks || []) {
                      for (const para of block.paragraphs || []) {
                        for (const word of para.words || []) {
                          const cleanWord = word.text.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                          if (cleanWord === code || (word.text.toUpperCase().includes(code.substring(0,3)))) {
                            setScannedBox(word.bbox);
                            boxFound = true;
                            break;
                          }
                        }
                        if (boxFound) break;
                      }
                      if (boxFound) break;
                    }
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

  // Draw overlay box when a code is found
  useEffect(() => {
    const overlay = overlayRef.current;
    const video = videoRef.current;
    if (!overlay || !video) return;
    
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    
    // match overlay to video dimensions
    overlay.width = video.clientWidth;
    overlay.height = video.clientHeight;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (scannedBox && scannedCode && cropData) {
      // Tesseract boxes are relative to the CROPPED canvas resolution
      const boxRealVideoX0 = (scannedBox.x0 / cropData.scale) + cropData.x;
      const boxRealVideoY0 = (scannedBox.y0 / cropData.scale) + cropData.y;
      const boxRealVideoX1 = (scannedBox.x1 / cropData.scale) + cropData.x;
      const boxRealVideoY1 = (scannedBox.y1 / cropData.scale) + cropData.y;

      const scaleX = video.clientWidth / video.videoWidth;
      const scaleY = video.clientHeight / video.videoHeight;
      
      const x = boxRealVideoX0 * scaleX;
      const y = boxRealVideoY0 * scaleY;
      const w = (boxRealVideoX1 - boxRealVideoX0) * scaleX;
      const h = (boxRealVideoY1 - boxRealVideoY0) * scaleY;
      
      // Draw border
      ctx.strokeStyle = "#4ade80"; // emerald-400
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, w, h);
      
      // Draw background for text
      ctx.fillStyle = "rgba(74, 222, 128, 0.2)";
      ctx.fillRect(x, y, w, h);
    }
  }, [scannedBox, scannedCode]);

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
    setScannedBox(null);
    setIsManualMode(false);
    setManualCode("");
    setErrorMsg(null);
    
    if (overlayRef.current) {
      const ctx = overlayRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Hidden canvas for OCR processing */}
      <canvas ref={canvasRef} className="hidden" />
      
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
        
        {/* Drawing Canvas for Box */}
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Target Reticle (shows when scanning) */}
        {!scannedCode && !isManualMode && !isLoading && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="w-56 h-72 border-2 border-white/30 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                 <p className="text-white/60 text-xs font-bold tracking-wider mb-1 uppercase">Sticker scannen</p>
                 <p className="text-white/40 text-[10px] leading-tight">Nummer oben rechts<br/>im Rahmen platzieren</p>
              </div>
            </div>
          </div>
        )}

        {/* Scanning Indicator */}
        {isRecognizing && !scannedCode && (
           <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600/80 backdrop-blur-md px-4 py-2 rounded-full text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 z-20">
             <div className="w-2 h-2 bg-white rounded-full animate-ping"></div> Scanne...
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
