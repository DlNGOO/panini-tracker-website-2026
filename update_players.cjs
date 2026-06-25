const fs = require('fs');

const csv = fs.readFileSync('Panini_WM_2026_Sticker_Liste.csv', 'utf8');
const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');

const playerNames = {};

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const parts = line.split(';');
  if (parts.length < 2) continue;
  let id = parts[0].trim();
  const name = parts[1].trim();

  // If id is 00, Panini-Logo -> we'll skip or map it somewhere else if needed.
  if (id === '00') continue;

  const match = id.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    
    if (!playerNames[prefix]) {
      playerNames[prefix] = [];
    }
    playerNames[prefix][num - 1] = name;
  }
}

// Ensure length of arrays is 19 for FWC and 20 for others
for (const key of Object.keys(playerNames)) {
  const arr = playerNames[key];
  const len = key === 'FWC' ? 19 : 20;
  for (let i = 0; i < len; i++) {
    if (!arr[i]) arr[i] = `Unbekannt`;
  }
}

// Now generate the JSON string
let jsCode = 'export const PLAYER_NAMES: Record<string, string[]> = {\n';
for (const key of Object.keys(playerNames)) {
  jsCode += `  ${key}: [\n`;
  for (let i = 0; i < playerNames[key].length; i++) {
    jsCode += `    ${JSON.stringify(playerNames[key][i])},\n`;
  }
  jsCode += `  ],\n`;
}
jsCode += '};\n';

let tsFile = fs.readFileSync('src/playerData.ts', 'utf8');

const startMarker = 'export const PLAYER_NAMES: Record<string, string[]> = {';
const endRegex = /};\s*\n(?!.*};.*)(?=\s*\/\*\*|\s*export function)/s;
// Let's use a simpler way: find startMarker, and then find the next `};` followed by `\n\n/**` or `export function`

const startIdx = tsFile.indexOf(startMarker);
if (startIdx !== -1) {
  // Find the end of PLAYER_NAMES. It's a huge object. 
  // Let's find the function `export function getStickerName` or `export function getStickerImageUrl`
  const getStickerNameIdx = tsFile.indexOf('export function getStickerName');
  if (getStickerNameIdx !== -1) {
    // The `};` before getStickerNameIdx is the end of PLAYER_NAMES
    const beforeFunc = tsFile.substring(startIdx, getStickerNameIdx);
    const lastBrace = beforeFunc.lastIndexOf('};');
    if (lastBrace !== -1) {
      const endIdx = startIdx + lastBrace + 2;
      const newTsFile = tsFile.substring(0, startIdx) + jsCode + tsFile.substring(endIdx);
      fs.writeFileSync('src/playerData.ts', newTsFile);
      console.log('Successfully updated src/playerData.ts');
    } else {
      console.error('Could not find end of PLAYER_NAMES');
    }
  } else {
     console.error('Could not find getStickerName');
  }
} else {
  console.error('Could not find start marker');
}
