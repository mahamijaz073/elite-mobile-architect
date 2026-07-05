// Auth is now handled lazily via AuthModal (shown when user attempts a
// token-earning action without being signed in). This file is kept as
// a fallback route redirect only.
import { Redirect } from 'expo-router';
export default function AuthScreen() {
  return <Redirect href="/(tabs)" />;
}
