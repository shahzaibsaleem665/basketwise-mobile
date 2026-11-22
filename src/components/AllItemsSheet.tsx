import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { ItemThumb, StoreTiles } from "@/components/ItemCard";
import { Button, Icon, Sheet, StoreBadge, Tap } from "@/components/ui";
import { money, othersRange, qtyLabel, storesStocking, titleCase } from "@/lib/view";
import type { ComparisonResult } from "@/lib/types";
import { c, F, t } from "@/theme";

export function AllItemsSheet({ visible, onClose, result }: { visible: boolean; onClose: () => void; result: ComparisonResult }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={`All ${result.items.length} items`}
      subtitle="Cheapest option for each · tap to see every store"
      footer={
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line }}>
          <View>
            <Text style={t.small}>Cheapest mix</Text>
            <Text style={{ fontFamily: F.bold, fontSize: 20, color: c.text }}>≈ ${Math.round(result.split.total)}</Text>
          </View>
          <Button label="Done" onPress={onClose} style={{ height: 48, paddingHorizontal: 26 }} />
        </View>
      }
    >
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        {result.items.map((it, n) => {
          const isOpen = open === it.item.query;
          const w = it.winner;
          return (
            <Animated.View key={it.item.query} entering={FadeIn.delay(Math.min(n, 10) * 35)} layout={LinearTransition.springify().damping(20)} style={{ borderBottomWidth: 1, borderBottomColor: "#ECF2ED" }}>
              <Tap onPress={() => setOpen(isOpen ? null : it.item.query)} scaleTo={0.99} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
                <ItemThumb it={it} size={44} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={t.bodyStrong}>
                    {titleCase(it.item.query)}
                  </Text>
                  <Text style={{ fontFamily: F.regular, fontSize: 12, color: c.textMuted }}>
                    {qtyLabel(it.item)} · at {storesStocking(it)} stores
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  {w ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <StoreBadge r={w} size={18} />
                      <Text style={{ fontFamily: F.bold, fontSize: 15, color: c.green }}>{money(it.picks[w].lineTotal)}</Text>
                    </View>
                  ) : (
                    <Text style={{ fontFamily: F.semibold, fontSize: 13, color: c.danger }}>Not found</Text>
                  )}
                  {othersRange(it) ? <Text style={{ fontFamily: F.regular, fontSize: 11, color: c.textMuted }}>{othersRange(it)}</Text> : null}
                </View>
                <View style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}>
                  <Icon name="chevron-forward" size={16} color={c.textFaint} />
                </View>
              </Tap>
              {isOpen && (
                <Animated.View entering={FadeIn.duration(200)} style={{ paddingBottom: 12 }}>
                  <StoreTiles it={it} />
                </Animated.View>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}
