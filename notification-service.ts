import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { UserProfile, COUNTRIES } from "./src/types";

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
  locks: Record<string, string>;
  logs: NotificationLog[];
}

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

export function saveLocksDb(db: LocksDb) {
  try {
    fs.writeFileSync(locksPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving locks database:", err);
  }
}

function getStickerDisplay(code: string): string {
  const countryKey = code.substring(0, 3).toUpperCase();
  const country = COUNTRIES[countryKey];
  const num = code.substring(3);
  const flag = country ? country.flag : "🏳️";
  const name = country ? country.name : countryKey;
  return `${flag} ${name} #${num}`;
}

// Mail transporter logic
let transporter: nodemailer.Transporter | null = null;
let mailInitStatus: "idle" | "ready" | "failed" = "idle";
let lastMailError: string | null = null;

export async function initializeMailBot() {
  if (mailInitStatus === "ready") return { status: "ready" };

  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    
    if (!smtpUser || !smtpPass) {
      mailInitStatus = "failed";
      lastMailError = "SMTP_USER oder SMTP_PASS fehlen in den Umgebungsvariablen.";
      return { status: "failed", error: lastMailError };
    }

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.verify();
    mailInitStatus = "ready";
    lastMailError = null;
    console.log("[Mail] Nodemailer ready to send emails.");
    return { status: "ready" };
  } catch (err: any) {
    console.error("[Mail] Failed to initialize mail transporter:", err);
    mailInitStatus = "failed";
    lastMailError = err.message || "Unknown error";
    return { status: "failed", error: lastMailError };
  }
}

export function getMailBotStatus() {
  return {
    status: mailInitStatus,
    error: lastMailError
  };
}

export async function runMatchmaking(profiles: Record<string, UserProfile>, updatedUserId: string) {
  const userA = profiles[updatedUserId.toLowerCase()];
  if (!userA) return;

  const db = getLocksDb();
  let hasChanges = false;

  const userADuplicates = Object.keys(userA.duplicates || {}).filter(
    (code) => (userA.duplicates?.[code] || 0) > 0
  );

  if (userADuplicates.length === 0) return;

  if (mailInitStatus === "idle" && process.env.SMTP_USER && process.env.SMTP_PASS) {
    await initializeMailBot();
  }

  for (const otherId of Object.keys(profiles)) {
    if (otherId.toLowerCase() === updatedUserId.toLowerCase()) continue;
    const userB = profiles[otherId];
    if (!userB) continue;
    if (!userA.groupId || !userB.groupId || userA.groupId !== userB.groupId) continue;

    const userBOwned = userB.owned || [];

    for (const stickerCode of userADuplicates) {
      const userBIsMissing = !userBOwned.includes(stickerCode);

      if (userBIsMissing) {
        const lockKey = `${userA.id}_to_${userB.id}_${stickerCode}`.toLowerCase();
        if (db.locks[lockKey]) continue;

        db.locks[lockKey] = new Date().toISOString();
        hasChanges = true;

        const stickerDisplay = getStickerDisplay(stickerCode);
        const subject = `🚨 Panini Tausch-Alarm: ${userA.name} hat ${stickerDisplay} für dich!`;
        const htmlMessage = `
          <h2>Hallo ${userB.name},</h2>
          <p>Gute Nachrichten aus deiner Panini WM 2026 Gruppe!</p>
          <p><strong>${userA.name}</strong> hat gerade einen Sticker doppelt eingetragen, den du noch suchst:</p>
          <h3 style="background-color: #f3f4f6; padding: 10px; border-radius: 8px; display: inline-block;">
            ${stickerDisplay}
          </h3>
          <p>Schau am besten gleich im <a href="https://panini-tracker-website-2026.onrender.com">Panini Tausch-Center</a> vorbei und biete einen Tausch an!</p>
          <br>
          <p>Viel Spaß beim Sammeln! ⚽</p>
        `;

        let status: "sent" | "failed" | "simulated" = "simulated";
        let details = "Keine E-Mail-Adresse hinterlegt oder Bot nicht konfiguriert.";
        
        const pref = userB.notifyPreference || "both";
        const hasEmail = !!userB.email;
        let notificationDetails: string[] = [];

        if (pref === "email" || pref === "both") {
          if (hasEmail) {
            if (mailInitStatus === "ready" && transporter) {
              try {
                await transporter.sendMail({
                  from: `"Panini Tracker Bot" <${process.env.SMTP_USER}>`,
                  to: userB.email,
                  subject: subject,
                  html: htmlMessage
                });
                status = "sent";
                details = `E-Mail erfolgreich an ${userB.email} gesendet.`;
                notificationDetails.push(`📧 E-Mail gesendet`);
              } catch (err: any) {
                console.error("[Mail] Error sending email:", err);
                status = "failed";
                details = `Fehler beim Versenden: ${err.message}`;
              }
            } else {
              status = "simulated";
              details = `Simuliert: E-Mail an ${userB.email} (SMTP nicht konfiguriert).`;
              notificationDetails.push(`📧 E-Mail simuliert`);
            }
          } else {
            notificationDetails.push(`⚠️ E-Mail bevorzugt, aber keine E-Mail-Adresse im Profil!`);
          }
        } else if (pref === "none") {
          details = "Benutzer hat Benachrichtigungen deaktiviert.";
        }

        const logEntry: NotificationLog = {
          id: lockKey,
          timestamp: new Date().toISOString(),
          userAId: userA.id,
          userAName: userA.name,
          userBId: userB.id,
          userBName: userB.name,
          stickerCode,
          stickerDetails: stickerDisplay,
          message: subject,
          status,
          details,
        };

        db.logs.unshift(logEntry);
      }
    }
  }

  if (hasChanges) {
    saveLocksDb(db);
  }
}
