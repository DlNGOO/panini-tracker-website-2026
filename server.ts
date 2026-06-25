import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { COUNTRIES, UserProfile } from "./src/types";
import {
  runMatchmaking,
  getLocksDb,
  saveLocksDb,
  initializeMailBot,
  getMailBotStatus
} from "./notification-service";

// Initialize Gemini AI only if API key is provided
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  console.log("Initializing Gemini Client on the server...");
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.log("GEMINI_API_KEY is not defined. Using regex fallback for sticker parsing.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Serve sticker images from panini_sticker_bilder folder
  const stickerImgPath = path.join(process.cwd(), "panini_sticker_bilder");
  app.use("/stickers", express.static(stickerImgPath));

  const dbPath = path.join(process.cwd(), "sticker_db.json");

  // One-time startup database clean-up to remove Benny, Hassan, Oliver, Jonas, and any undefined records
  try {
    let db: Record<string, any> = {};
    if (fs.existsSync(dbPath)) {
      try {
        db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
      } catch (e) {
        db = {};
      }
    }
    
    // Remove default profiles and undefined profiles completely
    const keysToRemove = ["benny", "hassan", "oliver", "jonas", "undefined"];
    let changed = false;
    for (const key of keysToRemove) {
      if (db[key]) {
        delete db[key];
        changed = true;
      }
    }
    
    // Ensure _groups exists
    if (!db._groups) {
      db._groups = {};
      changed = true;
    }

    if (changed || !db._db_cleared_to_zero) {
      db._db_cleared_to_zero = true;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
      console.log("Database cleaned of Benny, Hassan, Oliver, Jonas, and undefined.");
    }
  } catch (err) {
    console.error("Failed to clean database on startup:", err);
  }

  let memoryDb: Record<string, any> = {};

  // Initialize from local disk
  if (fs.existsSync(dbPath)) {
    try {
      memoryDb = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    } catch (e) {
      console.error("Local DB read error, starting fresh.");
    }
  }

  // Attempt to load from JSONBin if credentials are provided
  if (process.env.JSONBIN_BIN_ID && process.env.JSONBIN_API_KEY) {
    console.log("JSONBin credentials found. Fetching latest DB from cloud...");
    fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': process.env.JSONBIN_API_KEY }
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.record) {
        memoryDb = data.record;
        fs.writeFileSync(dbPath, JSON.stringify(memoryDb, null, 2), "utf-8");
        console.log("Successfully synchronized DB from JSONBin cloud.");
      }
    })
    .catch(err => console.error("Failed to fetch from JSONBin:", err));
  } else {
    console.log("No JSONBIN_BIN_ID found. Using local file database only.");
  }

  // Helper to read database
  function getDb(): Record<string, any> {
    return memoryDb;
  }

  let cloudSyncTimeout: NodeJS.Timeout | null = null;

  // Helper to save database
  function saveDb(data: Record<string, any>) {
    memoryDb = data;
    // Local backup
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving local db file:", err);
    }
    
    // Cloud sync (debounced to avoid rate limits)
    if (process.env.JSONBIN_BIN_ID && process.env.JSONBIN_API_KEY) {
      if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
      cloudSyncTimeout = setTimeout(() => {
        fetch(`https://api.jsonbin.io/v3/b/${process.env.JSONBIN_BIN_ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': process.env.JSONBIN_API_KEY!
          },
          body: JSON.stringify(memoryDb)
        }).catch(err => console.error("Cloud DB sync failed:", err));
      }, 5000); // 5 second debounce
    }
  }

  // --- API ROUTES ---

  // Register a new user profile with a password
  app.post("/api/register", (req, res) => {
    const { name, password, avatar, email, phoneNumber, notifyPreference, groupId } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: "Name und Passwort sind erforderlich." });
    }
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const db = getDb();
    if (db[id]) {
      return res.status(400).json({ error: "Dieser Nutzername existiert bereits." });
    }
    const newProfile = {
      id,
      name,
      password,
      avatar: avatar || "👤",
      owned: [],
      duplicates: {},
      email: email || "",
      phoneNumber: phoneNumber || "",
      notifyPreference: notifyPreference || "both",
      groupId: groupId || null
    };
    db[id] = newProfile;
    saveDb(db);
    res.json({ success: true, profile: newProfile });
  });

  // Login with name and password
  app.post("/api/login", (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: "Name und Passwort sind erforderlich." });
    }
    const db = getDb();
    // Search in profiles for matching name/email or id
    const searchId = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    let profile = db[searchId];
    
    if (!profile) {
      // Fallback search by name or email
      profile = Object.values(db).find(
        (p: any) => p && p.id && !p.id.startsWith("_") && p.id !== "undefined" &&
                    (p.name?.toLowerCase() === name.toLowerCase() || p.email?.toLowerCase() === name.toLowerCase())
      );
    }

    if (!profile || profile.password !== password) {
      return res.status(400).json({ error: "Falscher Nutzername oder falsches Passwort." });
    }
    res.json({ success: true, profile });
  });

  // Get all user profiles (filtered of system parameters)
  app.get("/api/profiles", (req, res) => {
    const db = getDb();
    const profiles = Object.values(db).filter(
      (p: any) => p && p.id && !p.id.startsWith("_") && p.id !== "undefined"
    );
    res.json(profiles);
  });

  // Get single user profile
  app.get("/api/profiles/:id", (req, res) => {
    const db = getDb();
    const profile = db[req.params.id.toLowerCase()];
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  });

  // Update a user profile
  app.post("/api/profiles/:id", (req, res) => {
    const id = req.params.id.toLowerCase();
    const { name, avatar, owned, duplicates, email, phoneNumber, notifyPreference, groupId, password } = req.body;

    const db = getDb();
    const existing = db[id];
    if (!existing) {
      return res.status(404).json({ error: "Profil nicht gefunden" });
    }

    if (name) existing.name = name;
    if (avatar) existing.avatar = avatar;
    if (owned !== undefined) existing.owned = owned;
    if (duplicates !== undefined) existing.duplicates = duplicates;
    if (email !== undefined) existing.email = email;
    if (phoneNumber !== undefined) existing.phoneNumber = phoneNumber;
    if (notifyPreference !== undefined) existing.notifyPreference = notifyPreference;
    if (groupId !== undefined) existing.groupId = groupId;
    if (password !== undefined) existing.password = password;

    db[id] = existing;
    saveDb(db);
    
    // Trigger intelligent trade matchmaking checks asynchronously
    runMatchmaking(db, id).catch((err) => {
      console.error("Error in matchmaking runner:", err);
    });

    res.json(existing);
  });

  // Create a new group
  app.post("/api/groups/create", (req, res) => {
    const { name, avatar, userId } = req.body;
    if (!name || !userId) {
      return res.status(400).json({ error: "Gruppenname und Ersteller-ID erforderlich." });
    }
    const db = getDb();
    if (!db._groups) db._groups = {};
    
    const groupId = "g-" + Math.random().toString(36).substring(2, 8);
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newGroup = {
      id: groupId,
      name,
      avatar: avatar || "⚽",
      inviteCode,
      createdBy: userId
    };
    
    db._groups[groupId] = newGroup;
    
    // Update user to be in this group
    if (db[userId]) {
      db[userId].groupId = groupId;
    }
    
    saveDb(db);
    res.json({ success: true, group: newGroup, profile: db[userId] });
  });

  // Join group via invite code
  app.post("/api/groups/join", (req, res) => {
    const { inviteCode, userId } = req.body;
    if (!inviteCode || !userId) {
      return res.status(400).json({ error: "Einladungscode und User-ID sind erforderlich." });
    }
    const db = getDb();
    if (!db._groups) db._groups = {};
    
    const codeUpper = inviteCode.trim().toUpperCase();
    const group = Object.values(db._groups).find((g: any) => g && g.inviteCode === codeUpper) as any;
    if (!group) {
      return res.status(404).json({ error: "Ungültiger Einladungscode." });
    }
    
    if (db[userId]) {
      db[userId].groupId = group.id;
    }
    
    saveDb(db);
    res.json({ success: true, group, profile: db[userId] });
  });

  // Get group details, members, matches, and bot analysis
  app.get("/api/groups/:id/details", (req, res) => {
    const groupId = req.params.id;
    const db = getDb();
    if (!db._groups || !db._groups[groupId]) {
      return res.status(404).json({ error: "Gruppe nicht gefunden." });
    }
    const group = db._groups[groupId];
    
    // Gather group members
    const members = Object.values(db).filter(
      (p: any) => p && p.id && !p.id.startsWith("_") && p.id !== "undefined" && p.groupId === groupId
    ) as UserProfile[];
    
    // Calculate trade matches among members
    const matches: any[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const userA = members[i];
        const userB = members[j];
        
        const duplicatesA = Object.keys(userA.duplicates || {}).filter((c) => (userA.duplicates?.[c] || 0) > 0);
        const duplicatesB = Object.keys(userB.duplicates || {}).filter((c) => (userB.duplicates?.[c] || 0) > 0);
        
        const userBOwned = userB.owned || [];
        const userAOwned = userA.owned || [];
        
        const userAGives = duplicatesA.filter((c) => !userBOwned.includes(c));
        const userBGives = duplicatesB.filter((c) => !userAOwned.includes(c));
        
        if (userAGives.length > 0 || userBGives.length > 0) {
          let type: "perfect" | "one-way-A" | "one-way-B" = "perfect";
          if (userAGives.length > 0 && userBGives.length === 0) {
            type = "one-way-A";
          } else if (userBGives.length > 0 && userAGives.length === 0) {
             type = "one-way-B";
          }
          matches.push({
            id: `${userA.id}-${userB.id}`,
            userA,
            userB,
            userAGives,
            userBGives,
            type
          });
        }
      }
    }
    
    // Generate bot analysis (which duplicates can go to who needs them)
    const botAnalysis: any[] = [];
    for (const member of members) {
      const dups = Object.keys(member.duplicates || {}).filter((c) => (member.duplicates?.[c] || 0) > 0);
      for (const dupCode of dups) {
        for (const other of members) {
          if (other.id === member.id) continue;
          if (!(other.owned || []).includes(dupCode)) {
            // member has dupCode, other lacks it!
            const countryPart = dupCode.substring(0, 3).toUpperCase();
            const country = COUNTRIES[countryPart];
            const flag = country ? country.flag : "🏳️";
            const countryName = country ? country.name : countryPart;
            const num = dupCode.substring(3);
            
            botAnalysis.push({
              giverName: member.name,
              giverAvatar: member.avatar,
              receiverName: other.name,
              stickerCode: dupCode,
              stickerDisplay: `[${flag} ${countryName} #${num}]`
            });
          }
        }
      }
    }
    
    res.json({
      group,
      members,
      matches,
      botAnalysis
    });
  });

  // Route to trigger a bot message to the WhatsApp group
  app.post("/api/groups/:id/bot-trigger", async (req, res) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Nachricht ist erforderlich" });
    }
    const { sendCustomWhatsAppMessage } = await import("./whatsapp-service");
    const result = await sendCustomWhatsAppMessage(message);
    res.json(result);
  });

  // Delete a user profile
  app.delete("/api/profiles/:id", (req, res) => {
    const id = req.params.id.toLowerCase();
    const db = getDb();
    if (db[id]) {
      delete db[id];
      saveDb(db);
      return res.json({ success: true });
    }
    res.status(404).json({ error: "Profile not found" });
  });

  // --- NEW TRADE MATCHMAKING & WHATSAPP NOTIFICATION ENDPOINTS ---

  // Get sent notification logs
  app.get("/api/notifications/logs", (req, res) => {
    const locksDb = getLocksDb();
    res.json(locksDb.logs || []);
  });

  // Reset anti-spam matchmaking locks & logs
  app.post("/api/notifications/reset-locks", (req, res) => {
    saveLocksDb({ locks: {}, logs: [] });
    res.json({ success: true });
  });

  // Get current Mail bot status
  app.get("/api/notifications/bot-status", (req, res) => {
    res.json(getMailBotStatus());
  });

  // Manually trigger Mail bot client initialization
  app.post("/api/notifications/bot-init", async (req, res) => {
    const result = await initializeMailBot();
    res.json(result);
  });

  // Intelligent text parser endpoint using Gemini or robust regex fallback
  app.post("/api/parse-stickers", async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "No text provided to parse" });
    }

    console.log(`Parsing request received, length: ${text.length}`);

    // If Gemini is available, let's use it for super-smart parsing
    if (ai) {
      try {
        console.log("Calling Gemini 3.5 Flash for intelligent parsing...");
        const prompt = `You are an expert Panini World Cup sticker parser. Extract sticker codes and quantities from the following text (which might be raw WhatsApp logs, simple lists, or unstructured messages).

        Sticker codes ALWAYS follow the pattern: [3-letter country code][1 to 20]. E.g. GER10, AUT13, CRO18, FWC5.
        
        Rules:
        1. Country codes MUST match one of the valid 3-letter codes: ${Object.keys(COUNTRIES).join(", ")}.
        2. Numbers are between 1 and 20.
        3. Quantities are determined by counts like "x2", "2x", "(x2)", "CRO 18 (2)", or repeated occurrences. Default quantity is 1.
        4. Sometimes countries are written on one line followed by a list of numbers, e.g. "CPV 11, 18" means CPV11 (qty 1) and CPV18 (qty 1).
        5. "CAN 2 (x2)" means CAN2 with quantity 2.
        
        Text to parse:
        """
        ${text}
        """
        
        Respond with ONLY a clean JSON object fitting this schema:
        {
          "stickers": [
            { "code": "AUT13", "quantity": 1 },
            { "code": "CAN2", "quantity": 2 }
          ]
        }`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                stickers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      code: { type: Type.STRING },
                      quantity: { type: Type.INTEGER }
                    },
                    required: ["code", "quantity"]
                  }
                }
              },
              required: ["stickers"]
            }
          }
        });

        const resultText = response.text || "";
        console.log("Gemini response successfully retrieved!");
        const result = JSON.parse(resultText.trim());
        return res.json({ method: "gemini", stickers: result.stickers });

      } catch (err) {
        console.error("Gemini parsing failed, falling back to regex parser:", err);
      }
    }

    // --- REGEX FALLBACK PARSER ---
    // This is incredibly robust and parses lists like "AUT 13, BRA 9, CAN 2 (x2)" or Benny's duplicates list
    console.log("Running fallback regex parser...");
    const stickers: { code: string; quantity: number }[] = [];
    const lines = text.split("\n");

    const countryCodes = Object.keys(COUNTRIES);

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Look for a country code at the start or in the line
      for (const cc of countryCodes) {
        // Find country code with space and numbers, e.g. "AUT 13, 15" or "AUT13"
        const countryRegex = new RegExp(`\\b${cc}\\b`, "i");
        if (countryRegex.test(line)) {
          // Found country, now extract all numbers on this line
          // Split by commas, spaces, or semicolons
          const parts = line.split(/[,;\s]+/);
          let activeCountry = cc;

          // Let's scan all numbers and modifiers
          // Matches a number optionally followed by multiplier like "(x2)", "(2)", "x2"
          // We can also just search numbers on the line
          const numMatches = line.matchAll(/\b(\d+)(?:\s*(?:x|\(|x\s*)(\d+)\)?)?\b/gi);
          for (const match of numMatches) {
            const numVal = parseInt(match[1], 10);
            if (numVal >= 1 && numVal <= 20) {
              // Check if this number is associated with the country (not part of date or other texts)
              // Let's check context. We can search for quantity
              let qty = 1;
              if (match[2]) {
                qty = parseInt(match[2], 10);
              } else {
                // Look around the number in the line for things like "(x2)" or "x2"
                const lineSection = line.substring(Math.max(0, (match.index || 0) - 5), Math.min(line.length, (match.index || 0) + 10));
                const multiplierMatch = lineSection.match(/(?:x|\()\s*(\d+)\)?/i);
                if (multiplierMatch) {
                  qty = parseInt(multiplierMatch[1], 10);
                }
              }

              // Verify if code exists
              const code = `${activeCountry}${numVal}`;
              const existingIndex = stickers.findIndex(s => s.code === code);
              if (existingIndex !== -1) {
                stickers[existingIndex].quantity += qty;
              } else {
                stickers.push({ code, quantity: qty });
              }
            }
          }
        }
      }
    }

    // Secondary pass: look for exact matches of code like "AUT13" or "AUT 13" in general text if list parsing didn't catch enough
    if (stickers.length === 0) {
      const generalRegex = /\b([A-Z]{3})\s*([0-9]+)\b/gi;
      let match;
      while ((match = generalRegex.exec(text)) !== null) {
        const country = match[1].toUpperCase();
        const num = parseInt(match[2], 10);
        if (countryCodes.includes(country) && num >= 1 && num <= 20) {
          const code = `${country}${num}`;
          if (!stickers.some(s => s.code === code)) {
            stickers.push({ code, quantity: 1 });
          }
        }
      }
    }

    res.json({ method: "regex", stickers });
  });

  // Reset database back to default initial state (good for testing)
  app.post("/api/reset", (req, res) => {
    const emptyDb = {
      _db_cleared_to_zero: true,
      _groups: {}
    };
    saveDb(emptyDb);
    res.json([]);
  });

  // --- VITE / STATIC SERVING ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
