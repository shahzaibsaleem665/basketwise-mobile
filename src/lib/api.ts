import { API_URL, APP_KEY } from "./config";
import type { ComparisonResult, ListItem, Location, Retailer, Store } from "./types";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 65000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { "content-type": "application/json", ...(APP_KEY ? { "x-app-key": APP_KEY } : {}), ...(init?.headers ?? {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError((body as { error?: string }).error ?? `Request failed (${res.status})`, res.status);
    return body as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === "AbortError") throw new ApiError("The server took too long. Try again in a moment.");
    throw new ApiError("Can't reach the server. Check your connection.");
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  postcode: (code: string) => call<Location>(`/api/postcode/${encodeURIComponent(code)}`, { timeoutMs: 15000 }),
  stores: (postcode: string) =>
    call<{ location: Location; stores: Partial<Record<Retailer, Store | null>> }>(`/api/stores?postcode=${postcode}`),
  parse: (text: string, mode: "list" | "meal" = "list") =>
    call<{ items: ListItem[]; ai: boolean }>("/api/parse", { method: "POST", body: JSON.stringify({ text, mode }), timeoutMs: 35000 }),
  locate: (lat: number, lng: number) => call<Location>(`/api/locate?lat=${lat}&lng=${lng}`, { timeoutMs: 15000 }),
  compare: (body: {
    postcode: string;
    items: ListItem[];
    retailers?: Retailer[];
    deviceRaw?: Partial<Record<Retailer, Record<string, unknown>>>;
  }) => call<ComparisonResult>("/api/compare", { method: "POST", body: JSON.stringify(body) }),
};
