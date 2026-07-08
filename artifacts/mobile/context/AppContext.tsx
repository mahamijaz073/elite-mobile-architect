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
  /** True when Firebase is unreachable and the app fell back to offline mode. */
  isOffline: boolean;
  tokens: number;
  tickets: number;
  secondsUntilAdReady: number;
  canWatchAd: boolean;
  isPoolLocked: boolean;
  dailySpinsUsed: number;
  maxFreeSpins: number;
  captchaStreak: number;
  /** Current token value in Pakistani Rupees (admin-adjustable). */
  tokenPriceRs: number;
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

/** 20-minute cooldown between ad watches */
const AD_COOLDOWN_SECONDS = 1200;
const MAX_FREE_SPINS = 3;
/** Tokens awarded per ad watch */
const TOKENS_PER_AD = 360;
const TOKENS_PER_CAPTCHA_SET = 12;
const CAPTCHA_SET_SIZE = 5;
const DEFAULT_TOKEN_PRICE_RS = 1.1;

/**
 * How long (ms) we wait for Firebase's first auth state emission before
 * giving up and proceeding in offline / guest mode.
 */
const AUTH_TIMEOUT_MS = 8_000;

/** AsyncStorage key where we cache the last known user for instant restore. */
const CACHED_USER_KEY = 'cachedUser';

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

/** Fetch the current token price from the API. Returns DEFAULT_TOKEN_PRICE_RS on any error. */
async function fetchTokenPrice(): Promise<number> {
  try {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) return DEFAULT_TOKEN_PRICE_RS;
    const res = await fetch(`https://${domain}/api/config/token-price`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return DEFAULT_TOKEN_PRICE_RS;
    const data = await res.json() as { tokenPriceRs?: number };
    return typeof data.tokenPriceRs === 'number' && data.tokenPriceRs > 0
      ? data.tokenPriceRs
      : DEFAULT_TOKEN_PRICE_RS;
  } catch {
    return DEFAULT_TOKEN_PRICE_RS;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Lazy-auth modal
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Token economy
  const [tokens, setTokens] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [lastAdWatchedAt, setLastAdWatchedAt] = useState(0);
  const [isPoolLocked, setIsPoolLocked] = useState(false);
  const [dailySpinsUsed, setDailySpinsUsed] = useState(0);
  const [captchaStreak, setCaptchaStreak] = useState(0);
  const [secondsUntilAdReady, setSecondsUntilAdReady] = useState(0);
  const [tokenPriceRs, setTokenPriceRs] = useState(DEFAULT_TOKEN_PRICE_RS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Firebase Auth listener with offline timeout ────────────────
  useEffect(() => {
    let resolved = false;
    let cancelled = false;

    // Step 1: immediately restore cached user so the UI isn't blank while
    // we wait for Firebase. Returning users can interact right away.
    AsyncStorage.getItem(CACHED_USER_KEY).then(raw => {
      if (cancelled || !raw) return;
      try {
        const cached: User = JSON.parse(raw);
        if (!cancelled) setUser(cached);
      } catch {
        // corrupted cache — ignore
      }
    });

    // Step 2: start the Firebase auth listener
    const unsubscribe = onAuthStateChanged(
      auth,
      firebaseUser => {
        if (cancelled) return;
        resolved = true;
        if (firebaseUser) {
          const appUser: User = {
            uid: firebaseUser.uid,
            name:
              firebaseUser.displayName ??
              firebaseUser.phoneNumber ??
              (firebaseUser.isAnonymous ? 'Guest Player' : 'Player'),
            email: firebaseUser.email ?? '',
            avatarInitials: makeInitials(firebaseUser.displayName, firebaseUser.phoneNumber),
            isAnonymous: firebaseUser.isAnonymous,
          };
          setUser(appUser);
          AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(appUser)).catch(() => {});
        } else {
          setUser(null);
          AsyncStorage.removeItem(CACHED_USER_KEY).catch(() => {});
        }
        setIsOffline(false);
        setIsLoading(false);
      },
      _error => {
        if (cancelled) return;
        resolved = true;
        setIsOffline(true);
        setIsLoading(false);
      },
    );

    // Step 3: safety-net timeout
    const timeoutId = setTimeout(() => {
      if (!resolved && !cancelled) {
        resolved = true;
        setIsOffline(true);
        setIsLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    return () => {
      cancelled = true;
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  // ── Fetch token price from API on mount ───────────────────────
  useEffect(() => {
    fetchTokenPrice().then(price => setTokenPriceRs(price));
  }, []);

  // ── Persist token economy ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [tokensStr, ticketsStr, lastAdStr, poolStr, spinStr, captchaStr] =
          await AsyncStorage.multiGet([
            'tokens', 'tickets', 'lastAdWatchedAt',
            'isPoolLocked', 'spinData', 'captchaStreak',
          ]);
        if (tokensStr[1]) setTokens(parseInt(tokensStr[1], 10));
        if (ticketsStr[1]) setTickets(parseInt(ticketsStr[1], 10));
        if (lastAdStr[1]) setLastAdWatchedAt(parseInt(lastAdStr[1], 10));
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

  const canWatchAd = secondsUntilAdReady === 0;

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
    await AsyncStorage.removeItem(CACHED_USER_KEY);
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
        isOffline,
        tokens,
        tickets,
        secondsUntilAdReady,
        canWatchAd,
        isPoolLocked,
        dailySpinsUsed,
        maxFreeSpins: MAX_FREE_SPINS,
        captchaStreak,
        tokenPriceRs,
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
