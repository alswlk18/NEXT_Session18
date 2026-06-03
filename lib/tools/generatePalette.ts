// eslint-disable-next-line @typescript-eslint/no-require-imports
const culori = require("culori") as {
  converter: (mode: string) => (color: string) => { l: number; c: number; h?: number } | undefined;
  formatHex: (color: object) => string | undefined;
  clampChroma: (color: object) => object;
};

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

const toOklch = culori.converter("oklch");

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toHex(l: number, c: number, h: number): string {
  return (
    culori.formatHex(culori.clampChroma({ mode: "oklch", l, c, h })) ?? "#000000"
  );
}

export function generatePalette({ base_hex, mood }: PaletteInput): Palette {
  const base = toOklch(base_hex) ?? toOklch("#4A6FA5")!;
  const baseH = base.h ?? 240;

  const moodLower = mood.toLowerCase();
  const isDark = /dark|night|deep|moody|bold/.test(moodLower);
  const isWarm = /warm|cozy|energetic|vibrant|orange|red/.test(moodLower);
  const isPremium = /premium|luxury|elegant|sophisticated/.test(moodLower);
  const isPlayful = /playful|fun|kids|bright|cheerful/.test(moodLower);

  const primaryL = clamp(isDark ? base.l * 0.85 : isPremium ? base.l * 0.9 : base.l, 0.35, 0.75);
  const primaryC = clamp(isPlayful ? base.c * 1.3 : isPremium ? base.c * 0.8 : base.c, 0.05, 0.35);

  const accentH = (baseH + 150) % 360;
  const accentL = clamp(isWarm ? 0.7 : 0.65, 0.5, 0.75);
  const accentC = clamp(isPlayful ? 0.18 : 0.12, 0.08, 0.25);

  const bgL = isDark ? 0.15 : 0.97;
  const sfL = isDark ? 0.22 : 0.995;
  const textL = isDark ? 0.92 : 0.15;
  const mutedL = isDark ? 0.65 : 0.45;

  return {
    primary: toHex(primaryL, primaryC, baseH),
    accent: toHex(accentL, accentC, accentH),
    background: toHex(bgL, 0.01, baseH),
    surface: toHex(sfL, 0.005, baseH),
    text: toHex(textL, 0.01, baseH),
    textMuted: toHex(mutedL, 0.02, baseH),
  };
}
