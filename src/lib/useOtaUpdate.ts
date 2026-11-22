import * as Updates from "expo-updates";
import { useEffect } from "react";
import { AppState } from "react-native";

/**
 * Over-the-air updates (EAS Update). On launch and whenever the app comes back to the
 * foreground, check the build's channel for a newer JS bundle; if there is one, download
 * it and restart into it. Does nothing in development or Expo Go.
 */
export function useOtaUpdate() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        const res = await Updates.checkForUpdateAsync();
        if (res.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Offline or no update server configured yet: carry on with the current bundle.
      } finally {
        checking = false;
      }
    };
    check();
    const sub = AppState.addEventListener("change", (s) => s === "active" && check());
    return () => sub.remove();
  }, []);
}
