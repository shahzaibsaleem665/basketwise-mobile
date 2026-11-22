import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useEffect, type ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { c, F, spring, STORE, t } from "@/theme";
import type { Retailer } from "@/lib/types";

export type IconName = keyof typeof Ionicons.glyphMap;

export const haptic = {
  tap: () => Platform.OS !== "web" && Haptics.selectionAsync().catch(() => {}),
  success: () => Platform.OS !== "web" && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
};

export function Icon({ name, size = 18, color = c.text }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

const APressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that dips slightly on press (spring). */
export function Tap({ style, children, onPress, scaleTo = 0.97, haptics = true, ...rest }: PressableProps & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  scaleTo?: number;
  haptics?: boolean;
}) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <APressable
      {...rest}
      onPressIn={() => (s.value = withSpring(scaleTo, spring))}
      onPressOut={() => (s.value = withSpring(1, spring))}
      onPress={(e) => {
        if (haptics) haptic.tap();
        onPress?.(e);
      }}
      style={[style, a]}
    >
      {children}
    </APressable>
  );
}

export function Button({ label, onPress, disabled, loading, variant = "primary", icon, style }: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const primary = variant === "primary";
  const bg = disabled ? c.lineStrong : primary ? c.forest : c.surface;
  const fg = primary || disabled ? c.onForest : c.text;
  return (
    <Tap
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        { height: 54, borderRadius: 14, backgroundColor: bg, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 18 },
        !primary && { borderWidth: 1, borderColor: c.lineStrong, height: 48 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={{ fontFamily: F.semibold, fontSize: primary ? 16 : 15, color: fg }}>{label}</Text>
    </Tap>
  );
}

export function StoreBadge({ r, size = 16 }: { r: Retailer; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: STORE[r].color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#FFFFFF", fontFamily: F.bold, fontSize: size * 0.56, includeFontPadding: false }}>{STORE[r].ab}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 16 }, style]}>{children}</View>;
}

/** Bottom sheet: dimmed backdrop, slides up on a spring, tap outside or the close button to dismiss. */
export function Sheet({ visible, onClose, title, subtitle, children, footer, height = "86%" }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  height?: `${number}%`;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible && (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(180)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.overlay }}>
            <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
          </Animated.View>
          <View style={{ flex: 1, justifyContent: "flex-end" }} pointerEvents="box-none">
            <Animated.View
              entering={SlideInDown.springify().damping(22).stiffness(220)}
              exiting={SlideOutDown.duration(220)}
              style={{ height, backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 12 }}
            >
              <View style={{ alignItems: "center", paddingTop: 10 }}>
                <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.lineStrong }} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={t.h1}>{title}</Text>
                  {subtitle ? <Text style={t.small}>{subtitle}</Text> : null}
                </View>
                <Tap onPress={onClose} accessibilityLabel="Close" scaleTo={0.9} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.surfaceAlt, alignItems: "center", justifyContent: "center" }}>
                  <Icon name="close" size={18} />
                </Tap>
              </View>
              <View style={{ flex: 1 }}>{children}</View>
              {footer}
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
}

/** Gentle shimmer block for loading states. */
export function Shimmer({ w, h, r = 8, style }: { w: number | `${number}%`; h: number; r?: number; style?: StyleProp<ViewStyle> }) {
  const p = useSharedValue(0.5);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [p]);
  const a = useAnimatedStyle(() => ({ opacity: p.value }));
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: c.surfaceAlt }, a, style]} />;
}

export function AiLabel({ text = "AI SUMMARY" }: { text?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Icon name="sparkles" size={14} color={c.greenMid} />
      <Text style={t.label}>{text}</Text>
    </View>
  );
}
