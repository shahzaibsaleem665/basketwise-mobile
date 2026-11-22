import * as ExpoLocation from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddItemsSheet } from "@/components/AddItemsSheet";
import { AllItemsSheet } from "@/components/AllItemsSheet";
import { ItemCard } from "@/components/ItemCard";
import { TotalCard } from "@/components/TotalCard";
import { AiLabel, Button, Card, haptic, Icon, Shimmer, Tap } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useCompare } from "@/lib/useCompare";
import { titleCase } from "@/lib/view";
import type { ListItem } from "@/lib/types";
import { useStore } from "@/state/store";
import { c, F, t } from "@/theme";

const WEB_NO_OUTLINE = (Platform.OS === "web" ? { outlineStyle: "none" } : {}) as object;
const PREVIEW_COUNT = 4;

export default function Home() {
  const insets = useSafeAreaInsets();
  const { location, items, result, setItems } = useStore();
  const { phase, run } = useCompare();
  const [addOpen, setAddOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);

  const compare = (list: ListItem[] = items) => {
    if (!location || !list.length) return;
    run(location.postcode, list);
  };

  const onListReady = (list: ListItem[]) => {
    setItems(list);
    setAddOpen(false);
    haptic.success();
    if (location) run(location.postcode, list);
  };

  const showResults = !!result && !phase.busy;
  const canCompare = !!location && items.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: insets.bottom + (showResults ? 32 : 110), gap: 12 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
          <Text style={t.brand}>BasketWise</Text>
          {result?.ai ? (
            <Animated.View entering={FadeIn} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Icon name="sparkles" size={13} color={c.greenMid} />
              <Text style={{ fontFamily: F.semibold, fontSize: 12, color: c.textMuted }}>AI matching on</Text>
            </Animated.View>
          ) : null}
        </View>

        <PostcodeCard compact={!!result || items.length > 0} />

        {/* Items */}
        {items.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(350)} exiting={FadeOut}>
            <Tap
              onPress={() => setAddOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Add your items"
              style={{ backgroundColor: c.surface, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#B9CBBD", borderRadius: 16, paddingVertical: 28, paddingHorizontal: 16, alignItems: "center", gap: 8 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.forest, alignItems: "center", justifyContent: "center" }}>
                <Icon name="add" size={24} color={c.onForest} />
              </View>
              <Text style={{ fontFamily: F.bold, fontSize: 17, color: c.text }}>Add your items</Text>
              <Text style={[t.small, { textAlign: "center", lineHeight: 19, maxWidth: 260 }]}>Paste a list, type items, or describe a meal like “spag bol for 4”</Text>
            </Tap>
            <HowItWorks />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn} layout={LinearTransition}>
            <Tap onPress={() => setAddOpen(true)} scaleTo={0.99} accessibilityLabel="Edit your list" style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: F.regular, fontSize: 14, color: c.textMuted }}>
                <Text style={{ fontFamily: F.bold, color: c.text }}>{items.length} items</Text> · {items.map((i) => titleCase(i.query)).join(", ")}
              </Text>
              <Text style={{ fontFamily: F.semibold, fontSize: 14, color: c.green }}>Edit</Text>
            </Tap>
          </Animated.View>
        )}

        {/* Loading */}
        {phase.busy && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}>
              <ActivityIndicator color={c.green} />
              <Text style={t.small}>{phase.message}…</Text>
            </View>
            {[0, 1, 2].map((k) => (
              <Card key={k} style={{ padding: 12, gap: 10 }}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  <Shimmer w={48} h={48} r={12} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Shimmer w="55%" h={14} />
                    <Shimmer w="35%" h={12} />
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {[0, 1, 2, 3].map((j) => (
                    <Shimmer key={j} w="23.5%" h={52} r={10} />
                  ))}
                </View>
              </Card>
            ))}
          </Animated.View>
        )}

        {phase.error && !phase.busy ? (
          <Animated.View entering={FadeIn}>
            <Card style={{ padding: 14, gap: 10 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: c.danger }}>Couldn't get prices</Text>
              <Text style={t.small}>{phase.error}</Text>
              <Button label="Try again" variant="secondary" onPress={() => compare()} />
            </Card>
          </Animated.View>
        ) : null}

        {/* Results (same screen) */}
        {showResults && result && (
          <>
            <Animated.View entering={FadeInDown.duration(380)} style={{ backgroundColor: c.mint, borderWidth: 1, borderColor: c.mintLine, borderRadius: 16, padding: 14 }}>
              <AiLabel text={result.ai ? "AI SUMMARY" : "SUMMARY"} />
              <Text style={{ fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: "#1C2B22", marginTop: 6 }}>{result.summary}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 4, paddingTop: 6 }}>
              <Text style={t.h2}>Your items</Text>
              <Text style={t.small}>
                Showing {Math.min(PREVIEW_COUNT, result.items.length)} of {result.items.length}
              </Text>
            </Animated.View>

            {result.items.slice(0, PREVIEW_COUNT).map((it, n) => (
              <Animated.View key={it.item.query} entering={FadeInDown.delay(120 + n * 70).springify().damping(20)}>
                <ItemCard it={it} />
              </Animated.View>
            ))}

            {result.items.length > PREVIEW_COUNT && (
              <Animated.View entering={FadeInDown.delay(420)}>
                <Button label={`See all ${result.items.length} items`} variant="secondary" onPress={() => setAllOpen(true)} />
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(480).springify().damping(20)} style={{ marginTop: 4 }}>
              <TotalCard result={result} />
            </Animated.View>

            <Tap onPress={() => compare()} style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, padding: 10 }}>
              <Icon name="refresh" size={14} color={c.textMuted} />
              <Text style={t.small}>Refresh prices</Text>
            </Tap>
          </>
        )}
      </ScrollView>

      {/* Sticky compare button until there are results */}
      {!showResults && !phase.busy && (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 16, backgroundColor: c.bg }}>
          <Button label="Compare prices" disabled={!canCompare} onPress={() => compare()} />
        </View>
      )}

      <AddItemsSheet visible={addOpen} onClose={() => setAddOpen(false)} onCompare={onListReady} />
      {result && <AllItemsSheet visible={allOpen} onClose={() => setAllOpen(false)} result={result} />}
    </View>
  );
}

function HowItWorks() {
  const steps = ["Add what you need", "We match each item at Woolworths, Coles, ALDI and IGA", "See prices, stock and a rough total, all here"];
  return (
    <View style={{ paddingHorizontal: 4, gap: 10, marginTop: 18 }}>
      <Text style={{ fontFamily: F.semibold, fontSize: 13, color: c.textMuted }}>How it works</Text>
      {steps.map((s, i) => (
        <View key={s} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: F.bold, fontSize: 12, color: c.text }}>{i + 1}</Text>
          </View>
          <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 14, color: "#34443A" }}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

/** Postcode entry with suburb confirmation and an optional "use my location" (device GPS, no Google). */
function PostcodeCard({ compact }: { compact: boolean }) {
  const { location, setLocation } = useStore();
  const [code, setCode] = useState(location?.postcode ?? "");
  const [state, setState] = useState<"idle" | "checking" | "error" | "locating">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState(!location);

  useEffect(() => {
    if (code.length !== 4 || code === location?.postcode) return;
    let live = true;
    setState("checking");
    api
      .postcode(code)
      .then((l) => {
        if (!live) return;
        setLocation(l);
        setState("idle");
        setMsg(null);
      })
      .catch((e: ApiError) => {
        if (!live) return;
        setState("error");
        setMsg(e.status === 404 ? "We couldn't find that postcode." : e.message);
      });
    return () => {
      live = false;
    };
  }, [code, location?.postcode, setLocation]);

  const useMyLocation = async () => {
    setState("locating");
    setMsg(null);
    try {
      const perm = await ExpoLocation.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error("Location permission was declined. Enter your postcode instead.");
      const pos = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
      const l = await api.locate(pos.coords.latitude, pos.coords.longitude);
      setLocation(l);
      setCode(l.postcode);
      setEditing(false);
      setState("idle");
      haptic.success();
    } catch (e) {
      setState("error");
      setMsg((e as Error).message);
    }
  };

  if (compact && location && !editing) {
    return (
      <Tap onPress={() => setEditing(true)} scaleTo={0.99} accessibilityLabel="Change postcode" style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}>
        <Icon name="location-outline" size={16} color={c.green} />
        <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 14, color: c.text }}>
          {location.postcode} {location.suburbs[0]}
        </Text>
        <Text style={{ fontFamily: F.semibold, fontSize: 14, color: c.green }}>Change</Text>
      </Tap>
    );
  }

  return (
    <Card style={{ padding: 16 }}>
      <Text style={{ fontFamily: F.semibold, fontSize: 13, color: c.textMuted }}>Your postcode</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 4))}
          onBlur={() => location && code === location.postcode && setEditing(false)}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="2000"
          placeholderTextColor={c.textFaint}
          accessibilityLabel="Postcode"
          style={[WEB_NO_OUTLINE, { width: 110, height: 48, borderWidth: 1, borderColor: state === "error" ? c.danger : c.lineStrong, borderRadius: 12, paddingHorizontal: 14, fontFamily: F.semibold, fontSize: 18, color: c.text }]}
        />
        <View style={{ flex: 1 }}>
          {location && code === location.postcode ? (
            <>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: c.text }}>
                {location.suburbs[0]}, {location.state}
              </Text>
              <Text style={{ fontFamily: F.regular, fontSize: 12, color: c.textMuted }} numberOfLines={1}>
                {location.suburbs.slice(1, 3).join(", ") || "Prices for your area"}
              </Text>
            </>
          ) : (
            <Text style={t.small}>{state === "checking" ? "Checking…" : "Enter 4 digits"}</Text>
          )}
        </View>
        {state === "checking" || state === "locating" ? (
          <ActivityIndicator color={c.green} />
        ) : location && code === location.postcode ? (
          <Animated.View entering={FadeIn}>
            <Icon name="checkmark" size={22} color={c.greenMid} />
          </Animated.View>
        ) : null}
      </View>
      <Tap onPress={useMyLocation} haptics={false} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, alignSelf: "flex-start", minHeight: 32 }}>
        <Icon name="navigate-outline" size={15} color={c.green} />
        <Text style={{ fontFamily: F.semibold, fontSize: 13, color: c.green }}>Use my location</Text>
      </Tap>
      {msg ? <Text style={{ fontFamily: F.medium, fontSize: 13, color: c.danger, marginTop: 6 }}>{msg}</Text> : null}
    </Card>
  );
}
