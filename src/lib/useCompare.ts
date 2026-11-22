import { useCallback, useRef, useState } from "react";
import { api } from "./api";
import { deviceFetch } from "./deviceFetch";
import type { ComparisonResult, ListItem } from "./types";
import { useStore } from "@/state/store";

export type Phase = { busy: boolean; message?: string; error?: string };

/** Compare on demand: server first, then the phone fetches any store that blocked the server. */
export function useCompare() {
  const setResult = useStore((s) => s.setResult);
  const [phase, setPhase] = useState<Phase>({ busy: false });
  const running = useRef(false);

  const run = useCallback(
    async (postcode: string, items: ListItem[]) => {
      if (running.current || !items.length) return;
      running.current = true;
      setPhase({ busy: true, message: "Checking prices at 4 stores" });
      try {
        let res: ComparisonResult = await api.compare({ postcode, items });
        const blocked = res.needsDeviceFetch.filter((r) => res.deviceTemplates[r]);
        if (blocked.length) {
          setPhase({ busy: true, message: "Getting a few more prices" });
          const deviceRaw = await deviceFetch(res.deviceTemplates, items);
          if (Object.keys(deviceRaw).length) res = await api.compare({ postcode, items, deviceRaw });
        }
        setResult(res);
        setPhase({ busy: false });
      } catch (e) {
        setPhase({ busy: false, error: (e as Error).message });
      } finally {
        running.current = false;
      }
    },
    [setResult],
  );

  return { phase, run };
}
