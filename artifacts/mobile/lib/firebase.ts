/**
 * Firebase initialisation — QuizBox / CreditBox
 *
 * Project: creditbox-63ca9
 * API key is passed at build-time via EXPO_PUBLIC_GOOGLE_API_KEY.
 *
 * Why initializeAuth + AsyncStorage:
 *   getAuth() falls back to localStorage which does NOT exist on React Native,
 *   causing an immediate crash on Android / iOS native builds.
 *   On React Native, Metro resolves firebase/auth to the RN-specific build
 *   which exports initializeAuth + getReactNativePersistence. We load them
 *   via require() inside buildAuth() because the firebase/auth TypeScript
 *   declarations don't include these RN-only exports (runtime is fine).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
  authDomain: 'creditbox-63ca9.firebaseapp.com',
  projectId: 'creditbox-63ca9',
  storageBucket: 'creditbox-63ca9.firebasestorage.app',
  messagingSenderId: '110371990245',
  appId: '1:110371990245:web:0f82c6955b6ba2d41d820c',
  measurementId: 'G-8S0CHZLJ5J',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

function buildAuth() {
  if (Platform.OS === 'web') {
    // Expo web preview — use default browser persistence (localStorage is available).
    return getAuth(app);
  }

  // Android / iOS native build.
  // Metro resolves firebase/auth → its react-native build which exports
  // initializeAuth + getReactNativePersistence. We require() them to bypass
  // the TypeScript declarations that omit these RN-only symbols.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e: unknown) {
    // initializeAuth throws FirebaseError "auth/already-initialized" on hot-reload
    // when the Auth instance was already created in the same JS context.
    // Any other error is unexpected and should propagate so we don't silently
    // fall back to the unsafe web auth (which crashes on native).
    const code = (e as { code?: string })?.code;
    if (code === 'auth/already-initialized') {
      return getAuth(app);
    }
    throw e;
  }
}

export const auth = buildAuth();
export const db = getFirestore(app);
export default app;
