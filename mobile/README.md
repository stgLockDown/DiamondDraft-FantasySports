# DiamondDraft Mobile (Expo / React Native)

Native iOS + Android companion to the DiamondDraft web app. Built with Expo Router + React Query so ~90% of the service/store code is shared with `../frontend`.

## What's in the box

```
mobile/
├── app.json                # Expo config (scheme, deep links, icons)
├── eas.json                # EAS Build profiles (preview + production)
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root layout: query client, auth gate, deep-link handler
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Bottom tab bar (Home / Leagues / Scores / Players / Profile)
│   │   ├── index.tsx       # Home
│   │   ├── leagues.tsx     # My leagues
│   │   ├── scores.tsx      # Multi-sport live scoreboard (MLB/NFL/NBA/NHL)
│   │   ├── players.tsx     # Player search
│   │   └── profile.tsx     # Session info + logout
│   ├── league/[id].tsx     # League detail
│   ├── player/[mlbId].tsx  # Player detail (injury + news from ValorOdds proxy)
│   ├── login.tsx
│   ├── register.tsx
│   └── sso.tsx             # ValorOdds handoff landing
└── src/
    ├── services/api.ts     # Axios client (mirrors /frontend)
    ├── stores/authStore.ts # Zustand (mirrors /frontend, uses SecureStore)
    └── theme.ts
```

## Features

- **Full auth**: email/username + password, persisted in `expo-secure-store`.
- **Cross-product SSO**: `diamonddraft://sso?token=...` handles deep-links from ValorOdds → exchanges for a DD JWT via `POST /api/auth/sso/valorodds`.
- **Multi-sport live scoreboard** (MLB/NFL/NBA/NHL) backed by the new `/api/sports/:sport/snapshot` endpoint.
- **Injury & news** on player pages fed by the ValorOdds feed proxy.
- **Deep links**: `https://diamonddraft.app/...` (associated domains / App Links) and `diamonddraft://...` schemes are both registered in `app.json`.
- **Push notifications**: plugin wired in `app.json`; tokens can be registered once you add `NotificationsService.registerForPushNotificationsAsync()` to `_layout.tsx`. Left as a TODO so the app can build before you configure FCM / APNs.

## Getting started

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) to run on device. For deep-link and notification testing you'll need a development build:

```bash
npx expo prebuild
eas build --profile development --platform android    # or ios
```

## Environment

The app reads `apiUrl` from `app.json → expo.extra.apiUrl`. Override at build time with:

```
EXPO_PUBLIC_API_URL=https://staging.diamonddraft.app npx expo start
```

## Publishing

```bash
# Internal preview (APK for Android testers / TestFlight for iOS)
npm run eas:build:preview:android
npm run eas:build:production:ios

# Production
npm run eas:build:production:android
eas submit --platform ios
eas submit --platform android
```

You'll need to run `eas init` once and update `app.json → expo.extra.eas.projectId` with the returned project id.

## Assets placeholder

This scaffold does **not** commit actual icon PNGs (they'd need your branding treatment). Before your first EAS build, drop these into `mobile/assets/`:

| File | Size |
|---|---|
| `icon.png` | 1024×1024 |
| `adaptive-icon.png` | 1024×1024 (foreground, any shape in safe area) |
| `splash.png` | 1284×2778 or similar |
| `notification-icon.png` | 96×96 (monochrome) |

Expo will fail fast with a clear error if any of these are missing, so you can't accidentally ship without them.

## Known TODOs (not blockers)

- [ ] Draft Room screen (web has a rich WebSocket-driven UI — port after the initial release).
- [ ] Push-notification registration flow — stub the function and call from `_layout.tsx`.
- [ ] Mock Draft screen.
- [ ] Trade proposal flow.

## Code sharing status

| Concern | Web (frontend/) | Mobile (mobile/) | Shared? |
|---|---|---|---|
| API client | `src/services/api.ts` | `src/services/api.ts` | Near-identical |
| Auth store | `src/stores/authStore.ts` | `src/stores/authStore.ts` | Swap `localStorage` → `SecureStore` |
| Theme | CSS vars | `src/theme.ts` | Values match |
| Scoring / draft utils | `frontend/src/utils/*` | — | Could extract to a `packages/` workspace later |