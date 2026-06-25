import React, { useState, useRef } from "react";
import { UserProfile } from "../types";
import Avatar from "./Avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Upload, 
  Save, 
  LogOut, 
  Bell, 
  MailCheck, 
  Smartphone, 
  Sparkles, 
  Check, 
  Camera,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updatedFields: Partial<UserProfile>) => Promise<void>;
  onLogout: () => void;
  isLoading: boolean;
}

export default function ProfileView({
  profile,
  onUpdateProfile,
  onLogout,
  isLoading,
}: ProfileViewProps) {
  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || "");
  const [newPassword, setNewPassword] = useState("");
  const [notifyPreference, setNotifyPreference] = useState<"sms" | "email" | "both" | "none">(
    profile.notifyPreference || "both"
  );
  
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(
    profile.avatar && (profile.avatar.startsWith("data:") || profile.avatar.startsWith("http") || profile.avatar.length > 5)
      ? profile.avatar
      : null
  );
  const [selectedEmoji, setSelectedEmoji] = useState(
    profile.avatar && profile.avatar.length <= 5 ? profile.avatar : "⚽"
  );
  const [useEmoji, setUseEmoji] = useState(profile.avatar && profile.avatar.length <= 5);
  
  const [success, setSuccess] = useState<string | null>(null);
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
        setUseEmoji(false);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!name.trim()) {
      setError("Der Name darf nicht leer sein.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Bitte gib eine gültige E-Mail-Adresse an.");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Bitte gib eine gültige Telefonnummer an.");
      return;
    }

    const finalAvatar = useEmoji ? selectedEmoji : (uploadedAvatar || "👤");

    try {
      const updatePayload: Partial<UserProfile> = {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        avatar: finalAvatar,
        notifyPreference,
      };

      if (newPassword.trim()) {
        if (newPassword.length < 4) {
          setError("Das neue Passwort muss mindestens 4 Zeichen lang sein.");
          return;
        }
        updatePayload.password = newPassword.trim();
      }

      await onUpdateProfile(updatePayload);
      setNewPassword("");
      setSuccess("Profil erfolgreich aktualisiert!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern des Profils.");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden" id="profile-view-root">
      
      {/* Glow highlight */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" /> Mein Sammlerprofil
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Passe deine Accountdetails und Tausch-Benachrichtigungen an
          </p>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-950/30 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
        >
          <LogOut className="h-3.5 w-3.5" /> Abmelden
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        
        {/* Profile Pic Card */}
        <div className="lg:col-span-1 bg-slate-950/40 border border-slate-800 p-5 rounded-2xl flex flex-col items-center gap-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider self-start flex items-center gap-1.5">
            <Camera className="h-4 w-4" /> Profilbild
          </h3>
          
          <div className="relative group">
            <div 
              onClick={triggerFileInput}
              className="w-28 h-28 rounded-full bg-slate-950 border-2 border-slate-800 hover:border-indigo-500 flex items-center justify-center overflow-hidden cursor-pointer transition-all relative shadow-inner"
            >
              {useEmoji ? (
                <span className="text-5xl">{selectedEmoji}</span>
              ) : uploadedAvatar ? (
                <img src={uploadedAvatar} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <span className="text-5xl">👤</span>
              )}
              
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="h-5 w-5 text-white" />
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseEmoji(false)}
              className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md border ${
                !useEmoji
                  ? "bg-indigo-950/40 border-indigo-500 text-indigo-400"
                  : "border-slate-800 text-slate-500"
              }`}
            >
              Bild hochladen
            </button>
            <button
              type="button"
              onClick={() => setUseEmoji(true)}
              className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md border ${
                useEmoji
                  ? "bg-indigo-950/40 border-indigo-500 text-indigo-400"
                  : "border-slate-800 text-slate-500"
              }`}
            >
              Emoji nutzen
            </button>
          </div>

          {useEmoji && (
            <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-950 rounded-xl border border-slate-850 max-w-[160px]">
              {EMOJIS.map((emo) => (
                <button
                  key={emo}
                  type="button"
                  onClick={() => setSelectedEmoji(emo)}
                  className={`text-base p-1 rounded hover:bg-slate-900 transition-colors ${
                    selectedEmoji === emo ? "bg-slate-900 ring-1 ring-indigo-500" : ""
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Information & Notification preference */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <Check className="h-4 w-4" /> {success}
            </div>
          )}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {/* Form details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Nutzername
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Telefonnummer (für SMS-Alarme)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Password change */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Neues Passwort (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  🔑
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Unverändert lassen"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Notification channel preferences */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl space-y-3 mt-1">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Wo willst du benachrichtigt werden?
              </h4>
            </div>
            <p className="text-[10px] text-slate-500">
              Wenn ein anderer Sammler einen deiner gesuchten Sticker doppelt einträgt, schicken wir dir sofort einen Alarm über deine bevorzugten Kanäle:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Email preferred */}
              <button
                type="button"
                onClick={() => setNotifyPreference("email")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  notifyPreference === "email"
                    ? "bg-indigo-950/30 border-indigo-500 text-indigo-300"
                    : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300"
                }`}
              >
                <MailCheck className="h-5 w-5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Nur E-Mail</div>
                  <div className="text-[9px] mt-0.5 font-medium">Alarme an {email || "deine E-Mail"}</div>
                </div>
              </button>

              {/* SMS preferred */}
              <button
                type="button"
                onClick={() => setNotifyPreference("sms")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  notifyPreference === "sms"
                    ? "bg-indigo-950/30 border-indigo-500 text-indigo-300"
                    : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300"
                }`}
              >
                <Smartphone className="h-5 w-5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Nur SMS</div>
                  <div className="text-[9px] mt-0.5 font-medium">Alarme an {phoneNumber || "deine Nummer"}</div>
                </div>
              </button>

              {/* Both channels */}
              <button
                type="button"
                onClick={() => setNotifyPreference("both")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 sm:col-span-2 ${
                  notifyPreference === "both"
                    ? "bg-indigo-950/30 border-indigo-500 text-indigo-300"
                    : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300"
                }`}
              >
                <Sparkles className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Beide Kanäle (SMS & E-Mail)</div>
                  <div className="text-[9px] mt-0.5 font-medium">Volle Abdeckung! Alarme per Mail und per SMS</div>
                </div>
              </button>

              {/* Silent/None */}
              <button
                type="button"
                onClick={() => setNotifyPreference("none")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 sm:col-span-2 ${
                  notifyPreference === "none"
                    ? "bg-indigo-950/30 border-indigo-500 text-indigo-300"
                    : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300"
                }`}
              >
                <Bell className="h-5 w-5 text-slate-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Keine Benachrichtigungen (Stumm)</div>
                  <div className="text-[9px] mt-0.5 font-medium">Nur im Browser-Verlauf ansehen, kein aktiver Versand</div>
                </div>
              </button>
            </div>
          </div>

          {/* Group Membership Information */}
          {profile.groupId && (
            <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl space-y-3 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  👥 Aktive Gruppe
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  Du bist aktuell Mitglied einer Tauschgruppe. Möchtest du die Gruppe verlassen? Deine Gruppen-Statistiken werden gelöscht.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Möchtest du deine Tauschgruppe wirklich verlassen?")) {
                    try {
                      await onUpdateProfile({ groupId: null });
                      setSuccess("Gruppe erfolgreich verlassen!");
                      setTimeout(() => setSuccess(null), 3000);
                    } catch (err: any) {
                      setError(err.message || "Fehler beim Verlassen.");
                    }
                  }
                }}
                className="px-4 py-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-950/30 text-[10px] font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
              >
                Gruppe verlassen
              </button>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto self-end bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:text-slate-600 font-black text-xs uppercase px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Save className="h-4 w-4" /> Profil speichern
          </button>
        </div>

      </form>
    </div>
  );
}
