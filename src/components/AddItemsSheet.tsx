import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Button, Icon, Sheet, Tap } from "@/components/ui";
import { api } from "@/lib/api";
import { recognizeText } from "@/lib/ocr";
import type { ListItem } from "@/lib/types";
import { useStore } from "@/state/store";
import { c, F, spring, t } from "@/theme";

const WEB_NO_OUTLINE = (Platform.OS === "web" ? { outlineStyle: "none" } : {}) as object;
type Mode = "list" | "meal";

/** The one place items are added: typed, pasted, read from a screenshot, or generated from a meal. */
export function AddItemsSheet({ visible, onClose, onCompare }: { visible: boolean; onClose: () => void; onCompare: (items: ListItem[]) => void }) {
  const listText = useStore((s) => s.listText);
  const setListText = useStore((s) => s.setListText);
  const [mode, setMode] = useState<Mode>("list");
  const [text, setText] = useState(listText);
  const [meal, setMeal] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText(listText);
      setNote(null);
      setError(null);
    }
  }, [visible, listText]);

  const lines = text.split("\n").filter((l) => l.trim()).length;

  const paste = async () => {
    const clip = await Clipboard.getStringAsync();
    if (!clip.trim()) return setError("Your clipboard is empty. Copy a list first.");
    setText((prev) => (prev.trim() ? `${prev.trim()}\n${clip.trim()}` : clip.trim()));
    setNote("Pasted from your clipboard.");
    setError(null);
  };

  const screenshot = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return setError("Allow photo access to read a screenshot.");
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (res.canceled || !res.assets?.[0]) return;
    setBusy("Reading your screenshot");
    setError(null);
    try {
      const raw = await recognizeText(res.assets[0].uri);
      // Let the AI clean up OCR noise into one item per line.
      const { items } = await api.parse(raw, "list");
      const clean = items.map((i) => i.raw || i.query).join("\n");
      setText((prev) => (prev.trim() ? `${prev.trim()}\n${clean}` : clean));
      setNote(`Found ${items.length} items in your screenshot. Edit anything that's off.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const fromMeal = async () => {
    if (meal.trim().length < 3) return;
    setBusy("Working out the ingredients");
    setError(null);
    try {
      const { items } = await api.parse(meal, "meal");
      setText(items.map((i) => (i.count > 1 ? `${i.count} x ${i.raw || i.query}` : i.raw || i.query)).join("\n"));
      setNote(`AI made a list of ${items.length} ingredients for “${meal.trim()}”. Edit anything, then compare.`);
      setMode("list");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const compare = async () => {
    if (!text.trim()) return;
    setBusy("Understanding your list");
    setError(null);
    try {
      const { items } = await api.parse(text, "list");
      if (!items.length) {
        setError("We couldn't find any grocery items in that text.");
        return;
      }
      setListText(text);
      onCompare(items);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Add items"
      footer={
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {mode === "list" ? (
            <Button label={lines ? `Compare ${lines} item${lines > 1 ? "s" : ""}` : "Compare prices"} onPress={compare} disabled={!lines} loading={!!busy} />
          ) : (
            <Button label="Make my shopping list" icon="sparkles" onPress={fromMeal} disabled={meal.trim().length < 3} loading={!!busy} />
          )}
        </View>
      }
    >
      <View style={{ flex: 1, paddingHorizontal: 16, gap: 10 }}>
        <ModeSwitch mode={mode} onChange={setMode} />

        {mode === "list" ? (
          <>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
              placeholder={"Milk 2L\nEggs 12 pack\nSourdough bread\n2 x chicken breast"}
              placeholderTextColor={c.textFaint}
              accessibilityLabel="Your list"
              style={[WEB_NO_OUTLINE, { flex: 1, minHeight: 180, borderWidth: 1, borderColor: c.lineStrong, borderRadius: 14, padding: 14, fontFamily: F.regular, fontSize: 17, lineHeight: 28, color: c.text }]}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <SmallButton icon="clipboard-outline" label="Paste" onPress={paste} />
              <SmallButton icon="image-outline" label="Screenshot" onPress={screenshot} />
            </View>
          </>
        ) : (
          <>
            <Text style={t.small}>Tell us what you're cooking and for how many. We'll write the shopping list.</Text>
            <TextInput
              value={meal}
              onChangeText={setMeal}
              multiline
              textAlignVertical="top"
              placeholder="e.g. spaghetti bolognese for 4, plus breakfast for the week"
              placeholderTextColor={c.textFaint}
              accessibilityLabel="Describe a meal"
              style={[WEB_NO_OUTLINE, { minHeight: 140, borderWidth: 1, borderColor: c.lineStrong, borderRadius: 14, padding: 14, fontFamily: F.regular, fontSize: 17, lineHeight: 26, color: c.text }]}
            />
          </>
        )}

        {busy ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 12, backgroundColor: c.mint }}>
            <Icon name="sparkles" size={15} color={c.greenMid} />
            <Text style={{ fontFamily: F.medium, fontSize: 13, color: c.green }}>{busy}…</Text>
          </Animated.View>
        ) : note ? (
          <Animated.View entering={FadeIn} style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 12, backgroundColor: c.mint }}>
            <Icon name="sparkles" size={15} color={c.greenMid} />
            <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 13, lineHeight: 18, color: "#24543A" }}>{note}</Text>
          </Animated.View>
        ) : null}
        {error ? <Text style={{ fontFamily: F.medium, fontSize: 13, color: c.danger }}>{error}</Text> : null}
      </View>
    </Sheet>
  );
}

function SmallButton({ icon, label, onPress }: { icon: "clipboard-outline" | "image-outline"; label: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={label} style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: c.surfaceAlt, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
      <Icon name={icon} size={16} />
      <Text style={t.smallStrong}>{label}</Text>
    </Tap>
  );
}

/** Two-option switch with a sliding white pill. */
function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withSpring(mode === "list" ? 0 : w / 2, spring);
  }, [mode, w, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width - 8)} style={{ flexDirection: "row", backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 4 }}>
      {w > 0 && <Animated.View style={[{ position: "absolute", top: 4, left: 4, bottom: 4, width: w / 2, borderRadius: 9, backgroundColor: c.surface, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 }, pill]} />}
      <Tap onPress={() => onChange("list")} scaleTo={0.98} accessibilityRole="tab" accessibilityState={{ selected: mode === "list" }} style={{ flex: 1, height: 38, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: F.semibold, fontSize: 14, color: mode === "list" ? c.text : c.textMuted }}>My list</Text>
      </Tap>
      <Tap onPress={() => onChange("meal")} scaleTo={0.98} accessibilityRole="tab" accessibilityState={{ selected: mode === "meal" }} style={{ flex: 1, height: 38, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" }}>
        <Icon name="sparkles" size={14} color={c.greenMid} />
        <Text style={{ fontFamily: F.semibold, fontSize: 14, color: mode === "meal" ? c.text : c.textMuted }}>Describe a meal</Text>
      </Tap>
    </View>
  );
}
