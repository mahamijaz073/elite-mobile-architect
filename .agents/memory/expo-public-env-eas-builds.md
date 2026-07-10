---
name: EXPO_PUBLIC_ env vars are missing in EAS cloud builds
description: Dev-workflow env injection (pnpm run dev script) does not carry over to `eas build`; must be set in eas.json or EAS project env/secrets, or the app crashes at launch.
---

`EXPO_PUBLIC_*` variables set via the dev workflow's shell command (e.g. `EXPO_PUBLIC_GOOGLE_API_KEY=$GOOGLE_API_KEY expo start ...`) only exist in the Replit dev sandbox. EAS cloud builds (`eas build`) run in a separate environment and never see them unless explicitly configured.

**Why:** A QuizBox user reported the installed APK opening and immediately closing on every EAS build. Root cause: Firebase was initialized with `apiKey: undefined` because `EXPO_PUBLIC_GOOGLE_API_KEY` was never available to the EAS build.

**How to apply:** For any `EXPO_PUBLIC_*` var the app needs in a standalone/EAS build, add it to each profile's `env` block in `eas.json` (fine for values meant to be public, like Firebase web API keys), or better, set it via EAS project environment variables/secrets (`eas env:create`) so it isn't hardcoded in a committed file. Same applies to any backend base-URL var (e.g. `EXPO_PUBLIC_DOMAIN`) — the ephemeral Replit dev domain won't be reachable from a standalone build; it must point to a deployed backend URL.
