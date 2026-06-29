export interface UserProfile {
  id: string;
  name: string;
  password?: string; // Account password
  avatar: string; // List of emoji or Base64 uploaded image string
  owned: string[]; // List of sticker codes, e.g. ["GER1", "ARG10"]
  duplicates: Record<string, number>; // Mapping of sticker code to count, e.g. {"POR5": 1}
  email?: string;
  phoneNumber?: string;
  notifyPreference?: "sms" | "email" | "both" | "none";
  groupId?: string | null; // ID of the group the user belongs to
}

export interface Group {
  id: string;
  name: string;
  avatar: string; // Group icon / emoji
  inviteCode: string; // 6-char unique code
  createdBy: string; // user ID who created the group
}

export interface GroupDetails {
  group: Group;
  members: UserProfile[];
  matches: TradeMatch[];
  botAnalysis: {
    giverName: string;
    giverAvatar: string;
    receiverName: string;
    stickerCode: string;
    stickerDisplay: string;
  }[];
}

export interface TradeMatch {
  id: string;
  userA: UserProfile;
  userB: UserProfile;
  userAGives: string[]; // Codes of duplicates that A has and B needs
  userBGives: string[]; // Codes of duplicates that B has and A needs
  type: "perfect" | "one-way-A" | "one-way-B";
}

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

// 48 teams qualified for World Cup 2026 + Special Category (FWC)
export const COUNTRIES: Record<string, { name: string; flag: string; group: string }> = {
  FWC: { name: "FIFA Specials", flag: "/2026-FIFA-World-Cup-logo.png", group: "Special" },
  MEX: { name: "Mexiko", flag: "🇲🇽", group: "A" },
  RSA: { name: "Südafrika", flag: "🇿🇦", group: "A" },
  KOR: { name: "Südkorea", flag: "🇰🇷", group: "A" },
  CZE: { name: "Tschechien", flag: "🇨🇿", group: "A" },
  CAN: { name: "Kanada", flag: "🇨🇦", group: "B" },
  BIH: { name: "Bosnien und Herzegowina", flag: "🇧🇦", group: "B" },
  QAT: { name: "Katar", flag: "🇶🇦", group: "B" },
  SUI: { name: "Schweiz", flag: "🇨🇭", group: "B" },
  BRA: { name: "Brasilien", flag: "🇧🇷", group: "C" },
  MAR: { name: "Marokko", flag: "🇲🇦", group: "C" },
  HAI: { name: "Haiti", flag: "🇭🇹", group: "C" },
  SCO: { name: "Schottland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C" },
  USA: { name: "USA", flag: "🇺🇸", group: "D" },
  PAR: { name: "Paraguay", flag: "🇵🇾", group: "D" },
  AUS: { name: "Australien", flag: "🇦🇺", group: "D" },
  TUR: { name: "Türkei", flag: "🇹🇷", group: "D" },
  GER: { name: "Deutschland", flag: "🇩🇪", group: "E" },
  CUW: { name: "Curaçao", flag: "🇨🇼", group: "E" },
  CIV: { name: "Elfenbeinküste", flag: "🇨🇮", group: "E" },
  ECU: { name: "Ecuador", flag: "🇪🇨", group: "E" },
  NED: { name: "Niederlande", flag: "🇳🇱", group: "F" },
  JPN: { name: "Japan", flag: "🇯🇵", group: "F" },
  SWE: { name: "Schweden", flag: "🇸🇪", group: "F" },
  TUN: { name: "Tunesien", flag: "🇹🇳", group: "F" },
  BEL: { name: "Belgien", flag: "🇧🇪", group: "G" },
  EGY: { name: "Ägypten", flag: "🇪🇬", group: "G" },
  IRN: { name: "Iran", flag: "🇮🇷", group: "G" },
  NZL: { name: "Neuseeland", flag: "🇳🇿", group: "G" },
  ESP: { name: "Spanien", flag: "🇪🇸", group: "H" },
  CPV: { name: "Kap Verde", flag: "🇨🇻", group: "H" },
  KSA: { name: "Saudi-Arabien", flag: "🇸🇦", group: "H" },
  URU: { name: "Uruguay", flag: "🇺🇾", group: "H" },
  FRA: { name: "Frankreich", flag: "🇫🇷", group: "I" },
  SEN: { name: "Senegal", flag: "🇸🇳", group: "I" },
  IRQ: { name: "Irak", flag: "🇮🇶", group: "I" },
  NOR: { name: "Norwegen", flag: "🇳🇴", group: "I" },
  ARG: { name: "Argentinien", flag: "🇦🇷", group: "J" },
  ALG: { name: "Algerien", flag: "🇩🇿", group: "J" },
  AUT: { name: "Österreich", flag: "🇦🇹", group: "J" },
  JOR: { name: "Jordanien", flag: "🇯🇴", group: "J" },
  POR: { name: "Portugal", flag: "🇵🇹", group: "K" },
  COD: { name: "Kongo DR", flag: "🇨🇩", group: "K" },
  UZB: { name: "Usbekistan", flag: "🇺🇿", group: "K" },
  COL: { name: "Kolumbien", flag: "🇨🇴", group: "K" },
  ENG: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L" },
  CRO: { name: "Kroatien", flag: "🇭🇷", group: "L" },
  GHA: { name: "Ghana", flag: "🇬🇭", group: "L" },
  PAN: { name: "Panama", flag: "🇵🇦", group: "L" },
};

export const STICKERS_PER_TEAM = 20;

export function getStickersForCountry(countryKey: string): string[] {
  if (countryKey === "FWC") {
    // FWC has FWC00 and FWC1 to FWC19
    return ["FWC00", ...Array.from({ length: 19 }, (_, i) => `FWC${i + 1}`)];
  }
  return Array.from({ length: STICKERS_PER_TEAM }, (_, i) => `${countryKey}${i + 1}`);
}

// Returns sticker info if code is valid, e.g. "GER10" -> { country: "GER", num: 10 }
// Now supports FWC00
export function parseStickerCode(code: string): { country: string; num: number } | null {
  const match = code.trim().toUpperCase().match(/^([A-Z]{3})([0-9]+)$/);
  if (!match) return null;
  const country = match[1];
  const num = parseInt(match[2], 10);
  
  if (!COUNTRIES[country]) return null;
  
  if (country === "FWC") {
    if (match[2] === "00" || (num >= 1 && num <= 19)) {
      return { country, num }; // num will be 0 for "00"
    }
  } else if (num >= 1 && num <= STICKERS_PER_TEAM) {
    return { country, num };
  }
  
  return null;
}

// Simple helper to generate all sticker codes in album
export function getAllStickerCodes(): string[] {
  const codes: string[] = [];
  for (const country of Object.keys(COUNTRIES)) {
    codes.push(...getStickersForCountry(country));
  }
  return codes;
}
