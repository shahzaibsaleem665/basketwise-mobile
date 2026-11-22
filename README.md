# BasketWise (mobile)

Expo SDK 58 + Expo Router app for comparing a grocery list across **Woolworths, Coles, ALDI and IGA**. Everything happens on one screen: postcode (or GPS), an "Add items" bottom sheet (type, paste, screenshot, or describe a meal), then item cards, a "See all" sheet and a rough total.

The backend lives in its own repository (`basketwise-api`, deployed on Vercel). This app only needs its URL.

## Environment

Copy `.env.example` to `.env`:

```
# Base URL of your deployed basketwise-api project: no /api, no trailing slash
EXPO_PUBLIC_API_URL=https://<your-project>.vercel.app
# Only if you set APP_API_KEY on Vercel
EXPO_PUBLIC_APP_KEY=
```

The app calls `/api/postcode/:code`, `/api/locate`, `/api/parse` and `/api/compare` on that URL.

## Build with EAS

```bash
npm install
cp .env.example .env      # set EXPO_PUBLIC_API_URL to your Vercel URL (+ EXPO_PUBLIC_APP_KEY if you set one)
npx eas-cli@latest login
npx eas-cli@latest init   # links the project and writes the projectId into app.json
```

Add the same variables to EAS so cloud builds get them:
```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_API_URL --value https://<your-app>.vercel.app --environment development --environment preview --environment production --visibility plaintext
```

Then build:
```bash
npx eas-cli@latest build --profile development --platform android   # dev client (needed for OCR; Expo Go can't run ML Kit)
npx eas-cli@latest build --profile preview --platform android       # shareable APK
npx eas-cli@latest build --profile production --platform all        # store builds
npx eas-cli@latest submit --platform ios|android
```

Run the dev client against a local API: `npx expo start --dev-client`, with `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:3000`.

Bundle IDs are `com.codalyst.basketwise` (iOS and Android). Change them in `app.json` if you want. The splash uses the forest green (#1F4D33); the icon still uses Expo's placeholder art in `mobile/assets/images/`; swap in your own before you submit to the stores.


## Over-the-air (OTA) updates

`expo-updates` is installed and configured: `runtimeVersion` uses the `appVersion` policy, and each EAS build profile has its own channel (`development`, `preview`, `production`). The app checks for an update on launch and whenever it comes back to the foreground, downloads it, and restarts into it.

One-time setup (after `eas init`):
```bash
npx eas-cli@latest update:configure   # writes updates.url (https://u.expo.dev/<projectId>) into app.json
```
Then make a new build once, so the installed app knows its update URL and channel.

Ship a JS/design change to installed apps without a store release:
```bash
npm run update:preview -- "Fix price card spacing"      # testers on preview builds
npm run update:production -- "Fix price card spacing"   # everyone on store builds
```

OTA covers JavaScript, styles and images. Anything native (a new native package, permissions, app icon, splash, or the app `version` in app.json) needs a new build. Bump `version` when you do, so old builds don't receive bundles they can't run.

## Notes

- `src/lib/types.ts` mirrors `lib/types.ts` in the API repo. If you change the API's response shape, copy that file across.
- Screenshot reading uses on-device ML Kit, so it needs a dev/preview/production build (not Expo Go).
- "Use my location" uses the phone's GPS once and the API maps it to the nearest Australian postcode (no Google).
