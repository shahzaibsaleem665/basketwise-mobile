import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { Text, View } from "react-native";
import { Card, Icon, StoreBadge, Tap } from "@/components/ui";
import { heroFor, qtyLabel, tileFor, titleCase } from "@/lib/view";
import { RETAILERS, type ItemComparison, type Retailer } from "@/lib/types";
import { c, F, STORE, t, tintFor } from "@/theme";

/** Product picture (or a tinted placeholder) used by the item card and the full list. */
export function ItemThumb({ it, size = 48 }: { it: ItemComparison; size?: number }) {
  const [tint, ink] = tintFor(it.item.query);
  const { image } = heroFor(it);
  return (
    <View style={{ width: size, height: size, borderRadius: 12, backgroundColor: image ? "#FFFFFF" : tint, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: image ? 1 : 0, borderColor: c.line }}>
      {image ? <Image source={image} style={{ width: size - 6, height: size - 6 }} contentFit="contain" transition={200} /> : <Icon name="basket-outline" size={size * 0.45} color={ink} />}
    </View>
  );
}

export function StoreTiles({ it }: { it: ItemComparison }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {RETAILERS.map((r: Retailer) => {
        const v = tileFor(it, r);
        return (
          <View
            key={r}
            style={{
              flex: 1,
              borderRadius: 10,
              paddingVertical: 7,
              paddingHorizontal: 2,
              alignItems: "center",
              backgroundColor: v.best ? c.bestBg : "#F7FAF7",
              borderWidth: 1,
              borderColor: v.best ? c.bestLine : "#E6EEE8",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <StoreBadge r={r} />
              <Text style={{ fontFamily: F.semibold, fontSize: 11, color: "#46564B" }}>{STORE[r].short}</Text>
            </View>
            <Text style={{ fontFamily: F.bold, fontSize: 14, marginTop: 3, color: v.missing ? c.textFaint : v.best ? c.green : c.text, fontVariant: ["tabular-nums"] }}>{v.price}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: v.availColor }} />
              <Text style={{ fontFamily: F.medium, fontSize: 10, color: v.availColor }}>{v.avail}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function ItemCard({ it }: { it: ItemComparison }) {
  const [tint, ink] = tintFor(it.item.query);
  const { url, store } = heroFor(it);
  return (
    <Card style={{ padding: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <ItemThumb it={it} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={t.bodyStrong}>
            {titleCase(it.item.query)}
          </Text>
          <View style={{ alignSelf: "flex-start", marginTop: 3, backgroundColor: tint, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 12, color: ink }}>{qtyLabel(it.item)}</Text>
          </View>
        </View>
        {url && store ? (
          <Tap
            onPress={() => WebBrowser.openBrowserAsync(url)}
            accessibilityLabel={`View ${it.item.query} at ${STORE[store].short}`}
            style={{ flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44, paddingLeft: 8 }}
          >
            <Text style={{ fontFamily: F.semibold, fontSize: 12, color: c.green }}>View</Text>
            <View style={{ transform: [{ rotate: "45deg" }] }}>
              <Icon name="arrow-up-outline" size={13} color={c.green} />
            </View>
          </Tap>
        ) : null}
      </View>
      <View style={{ marginTop: 10 }}>
        <StoreTiles it={it} />
      </View>
    </Card>
  );
}
