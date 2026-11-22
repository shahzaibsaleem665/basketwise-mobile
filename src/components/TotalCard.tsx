import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Easing, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";
import { RETAILERS, type ComparisonResult } from "@/lib/types";
import { c, F, STORE } from "@/theme";

function useCountUp(target: number) {
  const v = useSharedValue(0);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    v.value = withTiming(target, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [target, v]);
  useAnimatedReaction(
    () => Math.round(v.value),
    (n, prev) => {
      if (n !== prev) runOnJS(setShown)(n);
    },
  );
  return shown;
}

/** "Roughly what your list costs": the last card on the screen. */
export function TotalCard({ result }: { result: ComparisonResult }) {
  const best = result.bestSingle;
  const shown = useCountUp(best ? best.total : 0);
  if (!best) return null;
  const peers = result.baskets.filter((b) => b.matched === best.matched).sort((a, b) => b.total - a.total);
  const saving = peers[0] && peers[0].retailer !== best.retailer ? peers[0].total - best.total : 0;
  const byStore = Object.fromEntries(result.baskets.map((b) => [b.retailer, b]));

  return (
    <View style={{ backgroundColor: c.forest, borderRadius: 18, padding: 18 }}>
      <Text style={{ fontFamily: F.semibold, fontSize: 13, color: c.onForestMuted }}>Roughly what your list costs</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 6 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 34, letterSpacing: -1, color: c.onForest }}>≈ ${shown}</Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 14, color: c.onForestGreen }}>at {STORE[best.retailer].short}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }}>
        {RETAILERS.map((r) => {
          const b = byStore[r];
          const isBest = r === best.retailer;
          return (
            <View key={r} style={{ flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: "center", backgroundColor: isBest ? "rgba(185,221,191,0.16)" : "rgba(255,255,255,0.06)" }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 11, color: "#D3E4D7" }}>{STORE[r].short}</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 15, color: isBest ? c.onForestGreen : c.onForest }}>{b?.matched ? `$${Math.round(b.total)}` : "—"}</Text>
              {b && b.missing > 0 && b.matched > 0 ? <Text style={{ fontFamily: F.medium, fontSize: 9, color: c.onForestMuted }}>{b.missing} missing</Text> : null}
            </View>
          );
        })}
      </View>
      <Text style={{ fontFamily: F.regular, fontSize: 12, lineHeight: 18, color: c.onForestMuted, marginTop: 12 }}>
        {saving >= 1 ? `You'd save about $${Math.round(saving)} compared with the priciest store. ` : ""}
        Approximate, based on online prices for {result.location.postcode}; in-store prices can differ.
      </Text>
    </View>
  );
}
