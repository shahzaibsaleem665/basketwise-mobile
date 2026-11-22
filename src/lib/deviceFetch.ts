import type { DeviceTemplate, ListItem, Retailer } from "./types";

/**
 * Fallback for when a supermarket refuses the server's cloud IP: the phone makes the
 * same public request from its own connection, trims the response to the fields the
 * server's parser needs (so the upload stays small), and hands it back for comparison.
 */

const KEEP = {
  woolworths: ["Stockcode", "Name", "DisplayName", "Brand", "PackageSize", "Price", "WasPrice", "IsOnSpecial", "CupPrice", "CupMeasure", "CupString", "MediumImageFile", "SmallImageFile", "UrlFriendlyName", "IsAvailable", "IsPurchasable"],
  coles: ["_type", "id", "name", "brand", "size", "packageSize", "availability", "imageUris", "pricing", "adId", "adSource"],
  aldi: ["sku", "name", "brandName", "urlSlugText", "sellingSize", "price", "assets", "discontinued"],
  iga: ["sku", "productId", "name", "brand", "image", "unitOfSize", "available", "priceNumeric", "wholePrice", "price", "wasPriceNumeric", "wasWholePrice", "wasPrice", "pricePerUnit", "unitPrice", "priceSource"],
} satisfies Record<Retailer, string[]>;

type Obj = Record<string, unknown>;
const pick = (o: unknown, keys: string[]): Obj => {
  const src = (o ?? {}) as Obj;
  const out: Obj = {};
  for (const k of keys) if (src[k] !== undefined) out[k] = src[k];
  if (Array.isArray(out.imageUris)) out.imageUris = out.imageUris.slice(0, 1);
  if (Array.isArray(out.assets)) out.assets = out.assets.slice(0, 1);
  return out;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v.slice(0, 24) : []);

export function trimPayload(retailer: Retailer, raw: unknown): unknown {
  const r = (raw ?? {}) as Obj;
  switch (retailer) {
    case "woolworths":
      return { Products: list(r.Products).map((b) => ({ Products: list((b as Obj).Products).slice(0, 2).map((p) => pick(p, KEEP.woolworths)) })) };
    case "coles": {
      const results = list(r.results ?? (r.searchResults as Obj | undefined)?.results);
      return { results: results.map((p) => pick(p, KEEP.coles)) };
    }
    case "aldi":
      return { data: list(r.data).map((p) => pick(p, KEEP.aldi)) };
    case "iga":
      return { items: list(r.items).map((p) => pick(p, KEEP.iga)) };
  }
}

async function fetchOne(t: DeviceTemplate, query: string): Promise<unknown | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(t.url.replace("{q}", encodeURIComponent(query)), { headers: t.headers, signal: ctrl.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function deviceFetch(
  templates: Partial<Record<Retailer, DeviceTemplate>>,
  items: ListItem[],
  onProgress?: (done: number, total: number) => void,
): Promise<Partial<Record<Retailer, Record<string, unknown>>>> {
  const jobs = (Object.keys(templates) as Retailer[]).flatMap((r) => items.map((i) => ({ r, q: i.query })));
  const out: Partial<Record<Retailer, Record<string, unknown>>> = {};
  let done = 0;
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const { r, q } = jobs[next++];
      const raw = await fetchOne(templates[r]!, q);
      if (raw) (out[r] ??= {})[q] = trimPayload(r, raw);
      onProgress?.(++done, jobs.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, jobs.length) }, worker));
  return out;
}
