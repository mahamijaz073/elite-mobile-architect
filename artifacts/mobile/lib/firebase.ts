/**
 * Firebase initialisation — QuizBox / CreditBox
 *
 * Project: creditbox-63ca9
 * API key is passed at build-time via EXPO_PUBLIC_GOOGLE_API_KEY
 * (set in Replit Secrets → the workflow dev command maps it).
 */
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
