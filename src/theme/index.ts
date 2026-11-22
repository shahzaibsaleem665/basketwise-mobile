import type { TextStyle } from "react-native";
import type { Retailer } from "@/lib/types";

/** Locked design (canvas row F): greens with black and white, minimal. Inter throughout. */
export const c = {
  bg: "#F3F6F2",
  surface: "#FFFFFF",
  surfaceAlt: "#ECF2ED",
  line: "#DDE6DF",
  lineStrong: "#C7D4CA",
  text: "#14231A",
  textMuted: "#5B6A60",
  textFaint: "#8E9C92",
  forest: "#1F4D33", // buttons, total card
  green: "#2F6B45",
  greenMid: "#3F8A5A",
  mint: "#E8F1EA", // AI cards
  mintLine: "#D3E4D7",
  bestBg: "#E3F0E5",
  bestLine: "#9CC9A6",
  onForest: "#FFFFFF",
  onForestMuted: "#B9CBBD",
  onForestGreen: "#B9DDBF",
  danger: "#A5432D",
  warn: "#9A6A1E",
  overlay: "rgba(20,35,26,0.45)",
};

export const STORE: Record<Retailer, { ab: string; short: string; color: string }> = {
  woolworths: { ab: "W", short: "Woolies", color: "#4F7F57" },
  coles: { ab: "C", short: "Coles", color: "#B0503A" },
  aldi: { ab: "A", short: "ALDI", color: "#45627A" },
  iga: { ab: "I", short: "IGA", color: "#B8862F" },
};

/** Soft natural tints for item cards, picked per item. [background, ink] */
export const ITEM_TINTS: [string, string][] = [
  ["#E3EFE6", "#2F6B45"],
  ["#F3ECD8", "#8A6A2B"],
  ["#F4E4D8", "#9A5B36"],
  ["#E6ECDD", "#55703C"],
  ["#E2ECEC", "#3D6B6B"],
  ["#EFE8E0", "#7A5C46"],
];

export function tintFor(key: string): [string, string] {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ITEM_TINTS[h % ITEM_TINTS.length];
}

export const F = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
};

export const t = {
  brand: { fontFamily: F.bold, fontSize: 22, letterSpacing: -0.4, color: c.text },
  h1: { fontFamily: F.bold, fontSize: 20, color: c.text },
  h2: { fontFamily: F.bold, fontSize: 17, color: c.text },
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: c.text },
  bodyStrong: { fontFamily: F.semibold, fontSize: 15, color: c.text },
  small: { fontFamily: F.regular, fontSize: 13, color: c.textMuted },
  smallStrong: { fontFamily: F.semibold, fontSize: 13, color: c.text },
  tiny: { fontFamily: F.medium, fontSize: 11, color: c.textMuted },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.3, color: c.green },
} satisfies Record<string, TextStyle>;

export const spring = { damping: 20, stiffness: 240, mass: 0.8 };
