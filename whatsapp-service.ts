import fs from "fs";
import path from "path";
import { UserProfile, COUNTRIES } from "./src/types";

// Paths for locks and logs
const locksPath = path.join(process.cwd(), "notification_locks.json");

export interface NotificationLog {
  id: string;
  timestamp: string;
  userAId: string;
  userAName: string;
  userBId: string;
  userBName: string;
  stickerCode: string;
  stickerDetails: string;
  message: string;
  status: "sent" | "failed" | "simulated";
  details?: string;
}

interface LocksDb {
  locks: Record<string, string>; // key -> timestamp
  logs: NotificationLog[];
}

// Read helper
export function getLocksDb(): LocksDb {
  try {
    if (!fs.existsSync(locksPath)) {
      return { locks: {}, logs: [] };
    }
    const data = fs.readFileSync(locksPath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading locks database:", err);
    return { locks: {}, logs: [] };
  }
}

// Save helper
export function saveLocksDb(db: LocksDb) {
  try {
    fs.writeFileSync(locksPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving locks database:", err);
  }
}

// WhatsApp Web Client declaration (lazily loaded)
let waClient: any = null;
let waInitStatus: "idle" | "initializing" | "ready" | "failed" = "idle";
let qrCodeValue: string | null = null;
let lastErrorMsg: string | null = null;

// Clean text formatting helper for stickers
function getStickerDisplay(code: string): string {
  const countryKey = code.substring(0, 3).toUpperCase();
  const country = COUNTRIES[countryKey];
  const num = code.substring(3);
  const flag = country ? country.flag : "🏳️";
  const name = country ? country.name : countryKey;
  return `${flag} ${name} #${num}`;
}

// Matchmaking Runner called whenever any user's profile is updated
export async function runMatchmaking(profiles: Record<string, UserProfile>, updatedUserId: string) {
  const userA = profiles[updatedUserId.toLowerCase()];
  if (!userA) return;

  console.log(`[Matchmaking] Running trade match check for updated user: ${userA.name}`);

  const db = getLocksDb();
  let hasChanges = false;

  // 1. Scan user A's duplicates
  const userADuplicates = Object.keys(userA.duplicates || {}).filter(
    (code) => (userA.duplicates?.[code] || 0) > 0
  );

  if (userADuplicates.length === 0) {
    console.log(`[Matchmaking] No duplicates found for ${userA.name}. Skipping.`);
    return;
  }

  // 2. Compare against all other users (User B)
  for (const otherId of Object.keys(profiles)) {
    if (otherId.toLowerCase() === updatedUserId.toLowerCase()) continue;
    const userB = profiles[otherId];
    if (!userB) continue;

    // Only match users who are in the same active group!
    if (!userA.groupId || !userB.groupId || userA.groupId !== userB.groupId) continue;

    const userBOwned = userB.owned || [];

    for (const stickerCode of userADuplicates) {
      // Is User B missing this sticker? (i.e. does not own it)
      const userBIsMissing = !userBOwned.includes(stickerCode);

      if (userBIsMissing) {
        // We found a match!
        // Lock key prevents spam: userA_to_userB_stickerCode
        const lockKey = `${userA.id}_to_${userB.id}_${stickerCode}`.toLowerCase();

        if (db.locks[lockKey]) {
          // Already notified about this exact match, do not spam!
          continue;
        }

        // Add lock
        const timestamp = new Date().toISOString();
        db.locks[lockKey] = timestamp;
        hasChanges = true;

        const stickerDisplay = getStickerDisplay(stickerCode);
        const messageText = `Tausch-Alarm! 🚨 ${userA.name} hat den Sticker [${stickerDisplay}] doppelt. ${userB.name} sucht diesen Sticker noch. Zeit für einen Tausch! ⚽️`;

        console.log(`[Matchmaking] MATCH FOUND: ${messageText}`);

        // Try sending via WhatsApp (or log and simulate if bot not fully authenticated)
        let status: "sent" | "failed" | "simulated" = "simulated";
        let details = "Der WhatsApp-Empfänger wurde simuliert (Aktivierung per QR-Code Scannen).";

        if (waClient && waInitStatus === "ready") {
          try {
            const inviteCode = "Jct87KPblvyDc5PA9m3MH1";
            console.log(`[WhatsApp] Attempting to join and send to group via invite: ${inviteCode}`);
            const groupChat = await waClient.acceptInvite(inviteCode);
            await waClient.sendMessage(groupChat.id._serialized, messageText);
            status = "sent";
            details = `Erfolgreich an WhatsApp-Gruppe "${groupChat.name}" gesendet.`;
          } catch (err: any) {
            console.error(`[WhatsApp] Failed to accept invite or send message:`, err);
            status = "failed";
            details = `Fehler beim Versenden: ${err.message || err}`;
          }
        }

        // Check notification preferences for userB
        const pref = userB.notifyPreference || "both";
        const hasEmail = !!userB.email;
        const hasPhone = !!userB.phoneNumber;
        let notificationDetails: string[] = [];

        if (pref === "email" || pref === "both") {
          if (hasEmail) {
            console.log(`\n==================================================`);
            console.log(`[E-MAIL SENT] To: ${userB.email}`);
            console.log(`Subject: 🚨 Panini WM 2026 Tausch-Alarm!`);
            console.log(`Body: Hallo ${userB.name},\n\n${userA.name} hat einen Sticker doppelt, den du noch suchst: [${stickerDisplay}]!\n\nTausche jetzt im Sticker-Manager! ⚽️`);
            console.log(`==================================================\n`);
            notificationDetails.push(`📧 E-Mail gesendet an ${userB.email}`);
          } else {
            notificationDetails.push(`⚠️ E-Mail bevorzugt, aber keine Adresse hinterlegt`);
          }
        }

        if (pref === "sms" || pref === "both") {
          if (hasPhone) {
            console.log(`\n==================================================`);
            console.log(`[SMS SENT] To: ${userB.phoneNumber}`);
            console.log(`Message: WM 2026 Tausch-Alarm: ${userA.name} hat ${stickerDisplay} doppelt, den du suchst!`);
            console.log(`==================================================\n`);
            notificationDetails.push(`💬 SMS gesendet an ${userB.phoneNumber}`);
          } else {
            notificationDetails.push(`⚠️ SMS bevorzugt, aber keine Telefonnummer hinterlegt`);
          }
        }

        if (pref === "none") {
          notificationDetails.push(`📴 Keine Benachrichtigungen gewünscht (Stumm)`);
        }

        if (notificationDetails.length > 0) {
          details += ` • ${notificationDetails.join(" | ")}`;
        }

        // Log notification entry
        const logEntry: NotificationLog = {
          id: lockKey,
          timestamp,
          userAId: userA.id,
          userAName: userA.name,
          userBId: userB.id,
          userBName: userB.name,
          stickerCode,
          stickerDetails: stickerDisplay,
          message: messageText,
          status,
          details,
        };

        db.logs.unshift(logEntry); // Add to beginning of log list
      }
    }
  }

  if (hasChanges) {
    saveLocksDb(db);
  }
}

// Lazy loader and manager for whatsapp-web.js
export async function initializeWhatsAppBot() {
  if (waInitStatus === "initializing" || waInitStatus === "ready") {
    return { status: waInitStatus, qrCode: qrCodeValue, error: lastErrorMsg };
  }

  waInitStatus = "initializing";
  qrCodeValue = null;
  lastErrorMsg = null;

  console.log("[WhatsApp] Starting dynamic import of whatsapp-web.js...");

  try {
    const { Client, LocalAuth } = await import("whatsapp-web.js");
    
    // Configure client with headless Chromium flags safe for Docker/Cloud Run
    waClient = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu"
        ],
      },
    });

    waClient.on("qr", (qr: string) => {
      console.log("[WhatsApp] QR Code received!");
      qrCodeValue = qr;
    });

    waClient.on("ready", () => {
      console.log("[WhatsApp] Bot client is fully authorized and ready!");
      waInitStatus = "ready";
      qrCodeValue = null;
    });

    waClient.on("auth_failure", (msg: string) => {
      console.error("[WhatsApp] Auth failure:", msg);
      waInitStatus = "failed";
      lastErrorMsg = `Auth Failure: ${msg}`;
    });

    waClient.on("disconnected", (reason: string) => {
      console.log("[WhatsApp] Disconnected:", reason);
      waInitStatus = "idle";
    });

    await waClient.initialize();
    
  } catch (err: any) {
    console.error("[WhatsApp] Failed to load whatsapp-web.js dependencies. Using robust simulated fallback mode.", err);
    waInitStatus = "failed";
    lastErrorMsg = `Dependency Error (Chromium/Puppeteer): ${err.message || err}. Bot falls back to simulated webhook display.`;
  }

  return { status: waInitStatus, qrCode: qrCodeValue, error: lastErrorMsg };
}

// Get bot details
export function getWhatsAppBotStatus() {
  return {
    status: waInitStatus,
    qrCode: qrCodeValue,
    error: lastErrorMsg,
  };
}

export async function sendCustomWhatsAppMessage(messageText: string): Promise<{ success: boolean; status: "sent" | "simulated" | "failed"; details: string }> {
  let status: "sent" | "failed" | "simulated" = "simulated";
  let details = "Der WhatsApp-Empfänger wurde simuliert.";

  if (waClient && waInitStatus === "ready") {
    try {
      const inviteCode = "Jct87KPblvyDc5PA9m3MH1";
      console.log(`[WhatsApp Custom] Attempting to join and send to group via invite: ${inviteCode}`);
      const groupChat = await waClient.acceptInvite(inviteCode);
      await waClient.sendMessage(groupChat.id._serialized, messageText);
      status = "sent";
      details = `Erfolgreich an WhatsApp-Gruppe "${groupChat.name}" gesendet.`;
    } catch (err: any) {
      console.error(`[WhatsApp Custom] Failed to send custom message:`, err);
      status = "failed";
      details = `Fehler beim Versenden: ${err.message || err}`;
    }
  }

  // Also log it!
  const db = getLocksDb();
  const timestamp = new Date().toISOString();
  db.logs.unshift({
    id: `custom_${Date.now()}`,
    timestamp,
    userAId: "bot",
    userAName: "Gruppen Bot",
    userBId: "all",
    userBName: "Gruppe",
    stickerCode: "ALL",
    stickerDetails: "Gruppen-Update",
    message: messageText,
    status,
    details
  });
  saveLocksDb(db);

  return { success: status !== "failed", status, details };
}
