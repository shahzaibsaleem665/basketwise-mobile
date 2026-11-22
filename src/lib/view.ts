import { c } from "@/theme";
import { RETAILERS, type ItemComparison, type ListItem, type Retailer, type RetailerPick } from "./types";

export const money = (n?: number) => (n === undefined || !isFinite(n) ? "—" : `$${n.toFixed(2)}`);
export const titleCase = (s: string) => s.replace(/\b\p{L}/gu, (ch) => ch.toUpperCase());

export function qtyLabel(i: ListItem): string {
  const size = i.amount
    ? i.amount.unit === "kg" && i.amount.value < 1
      ? `${Math.round(i.amount.value * 1000)}g`
      : i.amount.unit === "L" && i.amount.value < 1
        ? `${Math.round(i.amount.value * 1000)}mL`
        : `${i.amount.value}${i.amount.unit === "ea" ? " pack" : i.amount.unit}`
    : "Any size";
  return `${size} · ${i.count} needed`;
}

export interface TileView {
  price: string;
  avail: string;
  availColor: string;
  best: boolean;
  missing: boolean;
}

export function tileFor(it: ItemComparison, r: Retailer): TileView {
  const p: RetailerPick = it.picks[r];
  const best = it.winner === r;
  if (p.lineTotal !== undefined && p.best) {
    const inStock = p.best.available;
    return { price: money(p.lineTotal), avail: inStock ? "In stock" : "Out of stock", availColor: inStock ? c.greenMid : c.warn, best, missing: false };
  }
  if (p.status === "blocked" || p.status === "error") return { price: "—", avail: "Unavailable", availColor: c.textFaint, best: false, missing: true };
  return { price: "—", avail: "Not stocked", availColor: c.danger, best: false, missing: true };
}

/** Image and link from the cheapest store's product (falling back to any store that has one). */
export function heroFor(it: ItemComparison): { image?: string; url?: string; store?: Retailer } {
  const order = it.winner ? [it.winner, ...RETAILERS.filter((r) => r !== it.winner)] : [...RETAILERS];
  const withImg = order.find((r) => it.picks[r].best?.image);
  const url = it.winner ? it.picks[it.winner].best?.url : undefined;
  return { image: withImg ? it.picks[withImg].best!.image : undefined, url, store: it.winner };
}

export function othersRange(it: ItemComparison): string | null {
  const prices = RETAILERS.filter((r) => r !== it.winner && it.picks[r].lineTotal !== undefined).map((r) => it.picks[r].lineTotal!);
  if (!prices.length) return null;
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  return lo === hi ? `others ${money(lo)}` : `others ${money(lo)}–${hi.toFixed(2)}`;
}

export const storesStocking = (it: ItemComparison) => RETAILERS.filter((r) => it.picks[r].lineTotal !== undefined).length;
