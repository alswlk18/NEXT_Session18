interface PaletteInput {
  base_hex: string;
  mood: string;
}

interface Palette {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  s = clamp(s); l = clamp(l);
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = h / 360;
  const r = Math.round(hue2rgb(p, q, hn + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, hn) * 255);
  const b = Math.round(hue2rgb(p, q, hn - 1 / 3) * 255);
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function generatePalette({ base_hex, mood }: PaletteInput): Palette {
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(base_hex) ? base_hex : "#4A6FA5";
  const [h, s, l] = hexToHsl(safeHex);

  const moodLower = mood.toLowerCase();
  const isDark = /dark|night|deep|moody|bold/.test(moodLower);
  const isPremium = /premium|luxury|elegant|sophisticated/.test(moodLower);
  const isPlayful = /playful|fun|kids|bright|cheerful/.test(moodLower);
  const isWarm = /warm|cozy|energetic|vibrant/.test(moodLower);

  const primaryL = clamp(isDark ? l * 0.75 : isPremium ? l * 0.85 : l, 0.3, 0.7);
  const primaryS = clamp(isPlayful ? s * 1.2 : isPremium ? s * 0.7 : s, 0.1, 0.9);

  const accentH = (h + 150) % 360;
  const accentL = isWarm ? 0.65 : 0.6;
  const accentS = isPlayful ? 0.7 : 0.5;

  const bgL = isDark ? 0.1 : 0.97;
  const sfL = isDark ? 0.16 : 1.0;
  const textL = isDark ? 0.92 : 0.12;
  const mutedL = isDark ? 0.6 : 0.45;

  return {
    primary: hslToHex(h, primaryS, primaryL),
    accent: hslToHex(accentH, accentS, accentL),
    background: hslToHex(h, 0.08, bgL),
    surface: hslToHex(h, 0.05, sfL),
    text: hslToHex(h, 0.08, textL),
    textMuted: hslToHex(h, 0.06, mutedL),
  };
}
