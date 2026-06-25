import React, { useState, useRef } from "react";
import { UserProfile } from "../types";
import Avatar from "./Avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Upload, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Check, 
  Sparkles,
  Camera,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginScreenProps {
  profiles: UserProfile[];
  onLogin: (username: string, password: string) => Promise<boolean>;
  onSignUp: (name: string, email: string, phoneNumber: string, avatar: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export default function LoginScreen({
  profiles,
  onLogin,
  onSignUp,
  isLoading,
}: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Login Form States
  const [selectedId, setSelectedId] = useState<string>("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Sign Up Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState("⚽");
  const [useEmoji, setUseEmoji] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EMOJIS = ["⚽", "🦁", "👑", "🌸", "🏆", "🌟", "🦅", "⚡", "🧉", "🔥", "🎨", "🎮", "🎸", "🍕", "🦾", "🦊"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Das Bild ist zu groß. Maximale Größe ist 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedAvatar(reader.result as string);
        setError(null);
      };
      reader.onerror = () => {
        setError("Fehler beim Lesen der Datei.");
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Bitte gib einen Nutzernamen an.");
      return;
    }
    if (!password.trim() || password.length < 4) {
      setError("Das Passwort muss mindestens 4 Zeichen lang sein.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Bitte gib eine gültige E-Mail-Adresse an.");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Bitte gib eine Telefonnummer an.");
      return;
    }

    const finalAvatar = useEmoji ? selectedEmoji : (uploadedAvatar || "👤");
    if (!useEmoji && !uploadedAvatar) {
      setError("Bitte lade ein Profilbild hoch oder wähle stattdessen ein Emoji.");
      return;
    }

    try {
      await onSignUp(username.trim(), email.trim(), phoneNumber.trim(), finalAvatar, password.trim());
    } catch (err: any) {
      setError(err.message || "Registrierung fehlgeschlagen.");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameToSubmit = selectedId ? profiles.find(p => p.id === selectedId)?.name : loginName;

    if (!nameToSubmit) {
      setError("Bitte wähle ein Profil aus oder gib einen Nutzernamen ein.");
      return;
    }
    if (!loginPassword) {
      setError("Bitte gib dein Passwort ein.");
      return;
    }

    try {
      const success = await onLogin(nameToSubmit, loginPassword);
      if (!success) {
        setError("Falscher Nutzername oder falsches Passwort.");
      }
    } catch (err: any) {
      setError(err.message || "Anmeldung fehlgeschlagen.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden" id="login-screen-root">

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 flex flex-col gap-6">
        
        {/* App Logo and Greeting */}
        <div className="text-center flex flex-col items-center gap-3">
          <span className="text-4xl bg-gradient-to-tr from-indigo-500 to-indigo-700 p-3 rounded-2xl border border-indigo-500/20 shadow-lg text-white">
            ⚽
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400 bg-clip-text text-transparent">
              PANINI WM 2026
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sticker-Manager • Chat-Gruppe Tauschbörse
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Card Border glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Form Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80 mb-6">
            <button
              onClick={() => { setActiveTab("login"); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" /> Anmelden
            </button>
            <button
              onClick={() => { setActiveTab("signup"); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" /> Registrieren
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-start gap-2.5 text-rose-400 text-xs mb-5 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab Views */}
          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleLoginSubmit}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Wähle dein Profil aus:
                  </label>
                  
                  {profiles.length === 0 ? (
                    <div className="space-y-3">
                      <div className="text-center py-4 text-slate-500 text-xs">
                        Keine Accounts vorhanden. Registriere dich!
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                          Nutzername oder E-Mail
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="z.B. Maxi"
                          value={loginName}
                          onChange={(e) => setLoginName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2.5 max-h-[150px] overflow-y-auto pr-1">
                        {profiles.map((p) => {
                          const isSelected = p.id === selectedId;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedId(p.id);
                                setLoginName(p.name);
                              }}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
                                isSelected
                                  ? "bg-indigo-950/40 border-indigo-500 text-indigo-200"
                                  : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/40 hover:text-slate-200 text-slate-400"
                              }`}
                            >
                              <Avatar avatar={p.avatar} className="text-xl" />
                              <span className="font-semibold text-xs truncate">{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Password field */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Passwort eingeben:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || (!selectedId && !loginName)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 font-black text-xs uppercase py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  Als Mitglied beitreten <ArrowRight className="h-4 w-4" />
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleSignUpSubmit}
                className="space-y-4"
              >
                {/* Profile Pic Upload */}
                <div className="flex flex-col items-center gap-3 pb-2 border-b border-slate-800/50">
                  <div className="relative group">
                    <div 
                      onClick={triggerFileInput}
                      className="w-20 h-20 rounded-full bg-slate-950 border-2 border-slate-800 hover:border-indigo-500 flex items-center justify-center overflow-hidden cursor-pointer transition-all relative"
                    >
                      {useEmoji ? (
                        <span className="text-4xl">{selectedEmoji}</span>
                      ) : uploadedAvatar ? (
                        <img src={uploadedAvatar} className="w-full h-full object-cover" alt="Profile Upload" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-500 group-hover:text-slate-300">
                          <Camera className="h-6 w-6" />
                          <span className="text-[9px] font-bold uppercase mt-1">Upload</span>
                        </div>
                      )}
                      
                      {/* Dark Overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="h-4 w-4 text-white" />
                      </div>
                    </div>
 
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setUseEmoji(false)}
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${
                        !useEmoji
                          ? "bg-indigo-950/40 border-indigo-500 text-indigo-400"
                          : "border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Bild hochladen
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseEmoji(true)}
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${
                        useEmoji
                          ? "bg-indigo-950/40 border-indigo-500 text-indigo-400"
                          : "border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Emoji nutzen
                    </button>
                  </div>

                  {useEmoji && (
                    <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800/60 max-w-[280px]">
                      {EMOJIS.map((emo) => (
                        <button
                          key={emo}
                          type="button"
                          onClick={() => setSelectedEmoji(emo)}
                          className={`text-lg p-1 rounded-md hover:bg-slate-900 transition-colors ${
                            selectedEmoji === emo ? "bg-slate-900 ring-1 ring-indigo-500" : ""
                          }`}
                        >
                          {emo}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  {/* Username */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Nutzername
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="z.B. Maxi"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Passwort (für den Login)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500">
                        🔑
                      </span>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      E-Mail-Adresse (für Alarme)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="maxi@beispiel.de"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Phone number */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Telefonnummer (für SMS)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500">
                        <Phone className="h-4 w-4" />
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="+49 170 1234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 font-black text-xs uppercase py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg mt-2"
                >
                  Account erstellen & Beitreten <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Feature Highlights Footer */}
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex items-center gap-3.5 text-xs text-slate-400">
          <div className="bg-indigo-950/50 text-indigo-400 p-2 rounded-xl shrink-0">
            🔔
          </div>
          <div>
            <strong className="text-slate-300 font-semibold">Echtzeit Tausch-Alarme:</strong> Sobald ein anderes Gruppenmitglied deine gesuchten Sticker doppelt einträgt, schickt das System dir sofort eine SMS oder eine E-Mail!
          </div>
        </div>
      </div>
    </div>
  );
}
