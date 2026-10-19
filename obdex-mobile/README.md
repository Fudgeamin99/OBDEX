# OBDEX for Android and iPhone

The OBDEX phone app, built from the OBDEX App Design-2 screens: splash, onboarding, login and register, home, search, MOT and Tax Check, HPI Check, My Garage, buying checklist, profile, theme and subscription.

It is one Expo (React Native) codebase that builds to both an Android app and an iPhone app.

## Try it on your phone today

1. Install **Node 20+** on your computer and the **Expo Go** app on your phone (App Store or Google Play).
2. In this folder run:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code: with the Camera app on iPhone, or from inside Expo Go on Android.

It runs on demo data straight away. Try the plates `FG52 YPA` (clean) and `OB21 DEX` (finance, a mileage drop and a recall).

## Connect real data

The phone app never holds API keys. It asks the OBDEX server in `../obdex-app`, which holds them.

1. Set up the server's `.env` (see `../obdex-app/README.md`):
   - `MOT_*`: DVSA MOT History API (free, apply at documentation.history.mot.api.gov.uk)
   - `DVLA_API_KEY`: DVLA Vehicle Enquiry Service for tax (free)
   - `HPI_*`: your paid history-check provider
2. Copy `.env.example` to `.env` here and set `EXPO_PUBLIC_API_URL` to the server address.

## Publish to the App Store and Google Play

Builds run in the cloud with EAS, so you do not need a Mac or Android Studio.

```bash
npm install -g eas-cli
eas login                  # free Expo account
eas build --platform android --profile preview   # installable APK to test
eas build --platform all --profile production    # store builds
eas submit --platform ios      # needs an Apple Developer account ($99/year)
eas submit --platform android  # needs a Google Play developer account ($25 once)
```

The app IDs are `com.obdex.app` on both platforms (set in `app.json`). Change them before the first store build if you want something else.

## Still to connect before launch

| Feature | Now | To go live |
| --- | --- | --- |
| Accounts, Google and Apple sign-in | Saved on the phone only | Firebase Auth or Supabase; swap the functions in `src/lib/auth.ts` |
| Subscriptions (Silver, Gold) | Choosing a plan unlocks it with no charge | App Store and Google Play billing, for example with RevenueCat |
| HPI data | Demo | A paid provider in the server |
| MOT and tax data | Demo | DVSA and DVLA keys in the server |

## Project layout

| Path | What it is |
| --- | --- |
| `src/app/` | One file per screen (Expo Router) |
| `src/components/` | Shared pieces: buttons, fields, header, plate bar, tables, chart |
| `src/lib/api.ts` | Vehicle lookups through the OBDEX server |
| `src/lib/analysis.ts` | MOT status, tax status, mileage clocking check, history flags |
| `src/lib/store.tsx` | Saved data: account, plan, theme, garage, checklists |
| `src/lib/theme.tsx` | Dark and light colours and fonts (Poppins) |
| `assets/` | App icon, splash and images cut from the OBDEX logo pack and design |

Checks before shipping: `npx tsc --noEmit` and `npx expo-doctor`.
