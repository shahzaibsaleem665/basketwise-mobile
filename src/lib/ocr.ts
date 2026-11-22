/**
 * On-device OCR with Google ML Kit (free, offline, no API key).
 * Needs a development/production build — it's a native module, so it is not in Expo Go.
 */
type Recognizer = { recognize: (uri: string) => Promise<{ text: string; blocks?: { lines?: { text: string }[] }[] }> };

let recognizer: Recognizer | null | undefined;

function load(): Recognizer | null {
  if (recognizer !== undefined) return recognizer;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-ml-kit/text-recognition");
    recognizer = (mod?.default ?? mod) as Recognizer;
  } catch {
    recognizer = null;
  }
  return recognizer;
}

export const ocrAvailable = () => !!load();

export async function recognizeText(uri: string): Promise<string> {
  const r = load();
  if (!r) throw new Error("Screenshot reading needs the installed app build (it isn't available in Expo Go).");
  const result = await r.recognize(uri);
  // Line-by-line keeps list structure better than the merged block text.
  const lines = result.blocks?.flatMap((b) => b.lines?.map((l) => l.text) ?? []) ?? [];
  return lines.length ? lines.join("\n") : result.text;
}
