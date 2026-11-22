export const RETAILERS = ["woolworths", "coles", "aldi", "iga"] as const;
export type Retailer = (typeof RETAILERS)[number];

export const RETAILER_LABEL: Record<Retailer, string> = {
  woolworths: "Woolworths",
  coles: "Coles",
  aldi: "ALDI",
  iga: "IGA",
};

/** Unit we normalise every unit price into, so stores can be compared fairly. */
export type BaseUnit = "kg" | "L" | "ea";

export interface UnitPrice {
  /** Price per 1 base unit (per kg, per litre, per each). */
  value: number;
  unit: BaseUnit;
  /** The retailer's own label, e.g. "$2.10 / 1L". */
  label?: string;
}

export interface Product {
  retailer: Retailer;
  id: string;
  name: string;
  brand?: string;
  size?: string;
  price: number;
  wasPrice?: number;
  isSpecial: boolean;
  unitPrice?: UnitPrice;
  image?: string;
  url?: string;
  available: boolean;
}

export interface Store {
  retailer: Retailer;
  id: string;
  name: string;
  address?: string;
  suburb?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  /** true when the price feed is tied to this store; false = national/online price. */
  storePricing: boolean;
}

export type SourceStatus = "ok" | "empty" | "blocked" | "error" | "skipped";

export interface SearchOutcome {
  status: SourceStatus;
  products: Product[];
  message?: string;
}

export interface Location {
  postcode: string;
  lat: number;
  lng: number;
  state: string;
  suburbs: string[];
}

export interface ListItem {
  /** What we search for, cleaned: "full cream milk". */
  query: string;
  /** Original line from the user / OCR. */
  raw: string;
  /** How many packs/units the user wants (default 1). */
  count: number;
  /** Requested amount, if the line carried one ("2L", "500g"). */
  amount?: { value: number; unit: BaseUnit };
}

export interface RetailerPick {
  status: SourceStatus;
  best?: Product;
  alternatives: Product[];
  /** best.price × packs needed. */
  lineTotal?: number;
  packs?: number;
  message?: string;
}

export interface ItemComparison {
  item: ListItem;
  picks: Record<Retailer, RetailerPick>;
  /** Retailer with the lowest lineTotal among those with a match. */
  winner?: Retailer;
  /** How much the winner saves vs the dearest matched store. */
  spread?: number;
}

export interface BasketSummary {
  retailer: Retailer;
  total: number;
  matched: number;
  missing: number;
}

export interface ComparisonResult {
  location: Location;
  stores: Partial<Record<Retailer, Store | null>>;
  items: ItemComparison[];
  baskets: BasketSummary[];
  /** Cheapest single store that matched every item (or the most items). */
  bestSingle?: BasketSummary;
  /** Buying each item where it is cheapest. */
  split: { total: number; byRetailer: Partial<Record<Retailer, number>>; savingVsBestSingle: number };
  sources: Record<Retailer, SourceStatus>;
  /** Retailers whose results the phone should fetch itself (server was blocked). */
  needsDeviceFetch: Retailer[];
  /** How the phone fetches them: URL with a `{q}` placeholder plus headers. */
  deviceTemplates: Partial<Record<Retailer, DeviceTemplate>>;
  generatedAt: string;
  /** Plain-English recap for the summary card (DeepSeek, or a rule-based fallback). */
  summary: string;
  /** true when DeepSeek helped with matching or the summary. */
  ai: boolean;
}

export interface DeviceTemplate {
  url: string;
  headers: Record<string, string>;
}
