import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface User {
  uid: string;
  name: string;
  email: string;
  avatarInitials: string;
  isAnonymous: boolean;
}

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  tokens: number;
  tickets: number;
  secondsUntilAdReady: number;
  canWatchAd: boolean;
  adsWatchedThisHour: number;
  maxAdsPerHour: number;
  isPoolLocked: boolean;
  dailySpinsUsed: number;
  maxFreeSpins: number;
  captchaStreak: number;
  /** Show the auth modal and, once signed in, run `action`. */
  requireAuth: (action: () => void) => void;
  authModalVisible: boolean;
  onAuthComplete: () => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
  onAdWatched: () => Promise<{ poolLocked: boolean }>;
  awardTokens: (amount: number) => Promise<void>;
  recordSpin: () => Promise<void>;
  onCaptchaSolved: () => Promise<{ rewardTokens: number; showAd: boolean }>;
  resetAdTimer: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const AD_COOLDOWN_SECONDS = 3600; // 60 minutes — 1 video per hour
const MAX_ADS_PER_HOUR = 24; // no practical daily cap
const MAX_FREE_SPINS = 3;
const TOKENS_PER_AD = 25;
const TOKENS_PER_CAPTCHA_SET = 12;
const CAPTCHA_SET_SIZE = 5;

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function makeInitials(displayName: string | null, phone: string | null): string {
  if (displayName) {
    const parts = displayName.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  if (phone) return phone.slice(-2);
  return 'QP';
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lazy-auth modal
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Token economy
  const [tokens, setTokens] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [lastAdWatchedAt, setLastAdWatchedAt] = useState(0);
  const [adLog, setAdLog] = useState<number[]>([]);
  const [isPoolLocked, setIsPoolLocked] = useState(false);
  const [dailySpinsUsed, setDailySpinsUsed] = useState(0);
  const [captchaStreak, setCaptchaStreak] = useState(0);
  const [secondsUntilAdReady, setSecondsUntilAdReady] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Firebase Auth listener ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name:
            firebaseUser.displayName ??
            firebaseUser.phoneNumber ??
            (firebaseUser.isAnonymous ? 'Guest Player' : 'Player'),
          email: firebaseUser.email ?? '',
          avatarInitials: makeInitials(firebaseUser.displayName, firebaseUser.phoneNumber),
          isAnonymous: firebaseUser.isAnonymous,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Persist token economy ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [tokensStr, ticketsStr, lastAdStr, adLogStr, poolStr, spinStr, captchaStr] =
          await AsyncStorage.multiGet([
            'tokens', 'tickets', 'lastAdWatchedAt',
            'adLog', 'isPoolLocked', 'spinData', 'captchaStreak',
          ]);
        if (tokensStr[1]) setTokens(parseInt(tokensStr[1], 10));
        if (ticketsStr[1]) setTickets(parseInt(ticketsStr[1], 10));
        if (lastAdStr[1]) setLastAdWatchedAt(parseInt(lastAdStr[1], 10));
        if (adLogStr[1]) setAdLog(JSON.parse(adLogStr[1]));
        if (poolStr[1]) setIsPoolLocked(poolStr[1] === 'true');
        if (captchaStr[1]) setCaptchaStreak(parseInt(captchaStr[1], 10));
        if (spinStr[1]) {
          const spinData = JSON.parse(spinStr[1]);
          const today = getTodayKey();
          setDailySpinsUsed(spinData.date === today ? spinData.count : 0);
        }
      } catch (_) {}
    })();
  }, []);

  // ── 20-min countdown ticker ────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const compute = () =>
      Math.max(0, AD_COOLDOWN_SECONDS - Math.floor((Date.now() - lastAdWatchedAt) / 1000));
    setSecondsUntilAdReady(compute());
    timerRef.current = setInterval(() => setSecondsUntilAdReady(compute()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [lastAdWatchedAt]);

  const adsWatchedThisHour = adLog.filter(t => Date.now() - t < 3_600_000).length;
  const canWatchAd = secondsUntilAdReady === 0 && adsWatchedThisHour < MAX_ADS_PER_HOUR;

  // ── Lazy auth ──────────────────────────────────────────────────
  const requireAuth = useCallback(
    (action: () => void) => {
      if (user) {
        action();
      } else {
        pendingActionRef.current = action;
        setAuthModalVisible(true);
      }
    },
    [user]
  );

  const onAuthComplete = useCallback(() => {
    setAuthModalVisible(false);
    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pending) pending();
  }, []);

  const closeAuthModal = useCallback(() => {
    pendingActionRef.current = null;
    setAuthModalVisible(false);
  }, []);

  // ── Actions ────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will set user = null
  };

  const awardTokens = async (amount: number) => {
    const newTotal = tokens + amount;
    setTokens(newTotal);
    await AsyncStorage.setItem('tokens', newTotal.toString());
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const resetAdTimer = async () => {
    const now = Date.now();
    setLastAdWatchedAt(now);
    await AsyncStorage.setItem('lastAdWatchedAt', now.toString());
    const newLog = [...adLog.filter(t => Date.now() - t < 3_600_000), now];
    setAdLog(newLog);
    await AsyncStorage.setItem('adLog', JSON.stringify(newLog));
  };

  const onAdWatched = async (): Promise<{ poolLocked: boolean }> => {
    await resetAdTimer();
    await awardTokens(TOKENS_PER_AD);
    return { poolLocked: isPoolLocked };
  };

  const recordSpin = async () => {
    const today = getTodayKey();
    const newCount = dailySpinsUsed + 1;
    setDailySpinsUsed(newCount);
    await AsyncStorage.setItem('spinData', JSON.stringify({ date: today, count: newCount }));
  };

  const onCaptchaSolved = async (): Promise<{ rewardTokens: number; showAd: boolean }> => {
    const newStreak = captchaStreak + 1;
    if (newStreak >= CAPTCHA_SET_SIZE) {
      setCaptchaStreak(0);
      await AsyncStorage.setItem('captchaStreak', '0');
      await awardTokens(TOKENS_PER_CAPTCHA_SET);
      return { rewardTokens: TOKENS_PER_CAPTCHA_SET, showAd: true };
    }
    setCaptchaStreak(newStreak);
    await AsyncStorage.setItem('captchaStreak', newStreak.toString());
    return { rewardTokens: 0, showAd: false };
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isLoading,
        tokens,
        tickets,
        secondsUntilAdReady,
        canWatchAd,
        adsWatchedThisHour,
        maxAdsPerHour: MAX_ADS_PER_HOUR,
        isPoolLocked,
        dailySpinsUsed,
        maxFreeSpins: MAX_FREE_SPINS,
        captchaStreak,
        requireAuth,
        authModalVisible,
        onAuthComplete,
        closeAuthModal,
        logout,
        onAdWatched,
        awardTokens,
        recordSpin,
        onCaptchaSolved,
        resetAdTimer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
