# QuizBox

A production-ready Reward & Quiz mobile app built with Expo React Native. Players collect tokens through quizzes, captcha solving, spinning a wheel, and watching videos — then redeem them for Gift Vouchers.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo dev server (scan QR code in Expo Go to test on device)
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54 + Expo Router v3 (file-based routing)
- State: React Context + AsyncStorage (local persistence)
- UI: react-native-svg (CountdownTimer, SpinWheel), @expo/vector-icons
- Fonts: Inter 400/500/600/700 via @expo-google-fonts/inter
- API: Express 5 (shared backend)

## Where things live

- `artifacts/mobile/` — Expo React Native app
  - `app/_layout.tsx` — Root layout: providers + AuthGuard (useEffect-based redirect)
  - `app/auth.tsx` — Auth screen: simulated Google Sign-In + Phone OTP
  - `app/(tabs)/` — 5 tabs: Home, Play, Spin, Feed, Rewards
  - `context/AppContext.tsx` — Global state: tokens, tickets, ad timer, spin count, captcha streak
  - `components/` — WalletCard, CountdownTimer, SpinWheel, PostCard, AdModal, TokenModal
  - `constants/colors.ts` — Dark gold theme (#0A0A14 bg, #F5C842 gold, #6C3FE8 accent)
  - `constants/mockData.ts` — Quiz questions, feed posts, banned words, spin segments
- `artifacts/api-server/` — Express API server
- `lib/api-spec/openapi.yaml` — API contract (source of truth for codegen)

## Architecture Decisions

- **AsyncStorage-first**: all persistence (tokens, ad timer, spins, captcha streak) uses AsyncStorage. Firebase integration is the production upgrade path — the architecture is ready for it.
- **Simulated ad engine**: AdModal simulates rewarded video ads with a 5-second countdown. Swap `AdModal` for real AdMob SDK calls in production native build.
- **Auth simulation**: Google Sign-In and Phone OTP are simulated. Wire `expo-auth-session` (Google) and Firebase Auth (Phone) for production.
- **AuthGuard pattern**: Uses `useSegments` + `useRouter` + `useEffect` instead of `<Redirect>` for reliable auth gating on all platforms.
- **Dark-only theme**: both `light` and `dark` color keys in `constants/colors.ts` use the same dark values. Set `userInterfaceStyle: "dark"` in `app.json`.
- **Spin ad-gating**: `adGrantedSpin` boolean state grants exactly one extra spin after ad completion, preventing infinite ad-loop.

## Product

**QuizBox — Play & Win · Collect Tokens · Redeem Prizes**

- **Home**: Wallet card (tokens + tickets), 20-min video reward countdown timer, Watch Video button with 3-per-hour frequency cap
- **Play**: Brain Quiz (15-sec timer per question, +5 tokens for correct, watch ad to retry) + Captcha Solver (every 5 correct = +20 tokens)
- **Spin**: SVG animated wheel with 8 segments, 3 free daily spins, ad-gated extra spins
- **Feed**: Scrollable admin posts with like/share/comment and banned-word comment moderation
- **Rewards**: Rs.500 Gift Voucher (5,000 tokens) + Rs.1,000 Gift Voucher (10,000 tokens) with pool-lock kill switch

## Google Play Compliance

All UI strings use approved terminology only: "QuizBox", "Play & Win", "Reward Hub", "Collect Tokens", "Redeem Prizes", "Gift Vouchers", "Claim Reward". No "Earn Money", "Make Cash", "Income", or payment-like language.

## User Preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/mobile run typecheck` after changes — the `useColors` hook types `palette` explicitly as `typeof colors.light` to avoid the TS2352 cast error when both `light` and `dark` keys exist on the colors object.
- Real AdMob, Firebase Auth, Firebase App Check, and Firebase Cloud Functions all require a **native build** (not Expo Go). Use EAS Build or Replit Expo Launch to generate the production binary.
- `transformOrigin` is not supported in React Native — the SpinWheel uses SVG `Path` + arc math instead of CSS-style pie segments.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for Expo Router patterns, safe area handling, and web compatibility rules
