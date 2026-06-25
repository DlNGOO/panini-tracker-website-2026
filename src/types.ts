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
  FWC: { name: "FIFA Specials", flag: "🏆", group: "Special" },
  GER: { name: "Deutschland", flag: "🇩🇪", group: "A" },
  USA: { name: "USA", flag: "🇺🇸", group: "A" },
  MEX: { name: "Mexiko", flag: "🇲🇽", group: "A" },
  CAN: { name: "Kanada", flag: "🇨🇦", group: "B" },
  ARG: { name: "Argentinien", flag: "🇦🇷", group: "B" },
  BRA: { name: "Brasilien", flag: "🇧🇷", group: "B" },
  ECU: { name: "Ecuador", flag: "🇪🇨", group: "B" },
  FRA: { name: "Frankreich", flag: "🇫🇷", group: "C" },
  ENG: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "C" },
  ESP: { name: "Spanien", flag: "🇪🇸", group: "C" },
  POR: { name: "Portugal", flag: "🇵🇹", group: "D" },
  BIH: { name: "Bosnien und Herzegowina", flag: "🇧🇦", group: "D" },
  CRO: { name: "Kroatien", flag: "🇭🇷", group: "D" },
  NED: { name: "Niederlande", flag: "🇳🇱", group: "E" },
  BEL: { name: "Belgien", flag: "🇧🇪", group: "E" },
  SUI: { name: "Schweiz", flag: "🇨🇭", group: "E" },
  AUT: { name: "Österreich", flag: "🇦🇹", group: "F" },
  TUR: { name: "Türkei", flag: "🇹🇷", group: "F" },
  CZE: { name: "Tschechien", flag: "🇨🇿", group: "F" },
  NOR: { name: "Norwegen", flag: "🇳🇴", group: "G" },
  SCO: { name: "Schottland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "G" },
  NZL: { name: "Neuseeland", flag: "🇳🇿", group: "G" },
  SWE: { name: "Schweden", flag: "🇸🇪", group: "H" },
  COL: { name: "Kolumbien", flag: "🇨🇴", group: "H" },
  URU: { name: "Uruguay", flag: "🇺🇾", group: "H" },
  MAR: { name: "Marokko", flag: "🇲🇦", group: "I" },
  TUN: { name: "Tunesien", flag: "🇹🇳", group: "I" },
  EGY: { name: "Ägypten", flag: "🇪🇬", group: "I" },
  ALG: { name: "Algerien", flag: "🇩🇿", group: "J" },
  JOR: { name: "Jordanien", flag: "🇯🇴", group: "J" },
  GHA: { name: "Ghana", flag: "🇬🇭", group: "J" },
  SEN: { name: "Senegal", flag: "🇸🇳", group: "K" },
  CUW: { name: "Curaçao", flag: "🇨🇼", group: "K" },
  RSA: { name: "Südafrika", flag: "🇿🇦", group: "K" },
  CPV: { name: "Kap Verde", flag: "🇨🇻", group: "L" },
  COD: { name: "Kongo DR", flag: "🇨🇩", group: "L" },
  CIV: { name: "Elfenbeinküste", flag: "🇨🇮", group: "L" },
  JPN: { name: "Japan", flag: "🇯🇵", group: "M" },
  KOR: { name: "Südkorea", flag: "🇰🇷", group: "M" },
  AUS: { name: "Australien", flag: "🇦🇺", group: "M" },
  IRN: { name: "Iran", flag: "🇮🇷", group: "N" },
  KSA: { name: "Saudi-Arabien", flag: "🇸🇦", group: "N" },
  IRQ: { name: "Irak", flag: "🇮🇶", group: "N" },
  UZB: { name: "Usbekistan", flag: "🇺🇿", group: "O" },
  QAT: { name: "Katar", flag: "🇶🇦", group: "O" },
  PAN: { name: "Panama", flag: "🇵🇦", group: "P" },
  PAR: { name: "Paraguay", flag: "🇵🇾", group: "P" },
  HAI: { name: "Haiti", flag: "🇭🇹", group: "P" },
};

// Returns sticker info if code is valid, e.g. "GER10" -> { country: "GER", num: 10 }
export function parseStickerCode(code: string): { country: string; num: number } | null {
  const match = code.trim().toUpperCase().match(/^([A-Z]{3})([0-9]+)$/);
  if (!match) return null;
  const country = match[1];
  const num = parseInt(match[2], 10);
  if (COUNTRIES[country] && num >= 1 && num <= 20) {
    return { country, num };
  }
  return null;
}

export const STICKERS_PER_TEAM = 20;

// Simple helper to generate all sticker codes in album
export function getAllStickerCodes(): string[] {
  const codes: string[] = [];
  for (const country of Object.keys(COUNTRIES)) {
    for (let i = 1; i <= STICKERS_PER_TEAM; i++) {
      codes.push(`${country}${i}`);
    }
  }
  return codes;
}
