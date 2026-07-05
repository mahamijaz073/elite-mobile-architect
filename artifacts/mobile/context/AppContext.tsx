import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export interface User {
  uid: string;
  name: string;
  email: string;
  avatarInitials: string;
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
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  onAdWatched: () => Promise<{ poolLocked: boolean }>;
  awardTokens: (amount: number) => Promise<void>;
  recordSpin: () => Promise<void>;
  onCaptchaSolved: () => Promise<{ rewardTokens: number; showAd: boolean }>;
  resetAdTimer: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const AD_COOLDOWN_SECONDS = 1200; // 20 minutes
const MAX_ADS_PER_HOUR = 3;
const MAX_FREE_SPINS = 3;
const TOKENS_PER_AD = 50;
const TOKENS_PER_CAPTCHA_SET = 20;
const CAPTCHA_SET_SIZE = 5;

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [lastAdWatchedAt, setLastAdWatchedAt] = useState(0);
  const [adLog, setAdLog] = useState<number[]>([]);
  const [isPoolLocked, setIsPoolLocked] = useState(false);
  const [dailySpinsUsed, setDailySpinsUsed] = useState(0);
  const [captchaStreak, setCaptchaStreak] = useState(0);
  const [secondsUntilAdReady, setSecondsUntilAdReady] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const [userStr, tokensStr, ticketsStr, lastAdStr, adLogStr, poolStr, spinStr, captchaStr] =
          await AsyncStorage.multiGet([
            'user', 'tokens', 'tickets', 'lastAdWatchedAt',
            'adLog', 'isPoolLocked', 'spinData', 'captchaStreak',
          ]);

        if (userStr[1]) setUser(JSON.parse(userStr[1]));
        if (tokensStr[1]) setTokens(parseInt(tokensStr[1], 10));
        if (ticketsStr[1]) setTickets(parseInt(ticketsStr[1], 10));
        if (lastAdStr[1]) setLastAdWatchedAt(parseInt(lastAdStr[1], 10));
        if (adLogStr[1]) setAdLog(JSON.parse(adLogStr[1]));
        if (poolStr[1]) setIsPoolLocked(poolStr[1] === 'true');
        if (captchaStr[1]) setCaptchaStreak(parseInt(captchaStr[1], 10));

        if (spinStr[1]) {
          const spinData = JSON.parse(spinStr[1]);
          const today = getTodayKey();
          if (spinData.date === today) {
            setDailySpinsUsed(spinData.count);
          } else {
            setDailySpinsUsed(0);
          }
        }
      } catch (_) {
        // ignore parse errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // 20-min countdown ticker
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastAdWatchedAt) / 1000);
      const remaining = Math.max(0, AD_COOLDOWN_SECONDS - elapsed);
      setSecondsUntilAdReady(remaining);
    }, 1000);
    // compute immediately
    const elapsed = Math.floor((Date.now() - lastAdWatchedAt) / 1000);
    setSecondsUntilAdReady(Math.max(0, AD_COOLDOWN_SECONDS - elapsed));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lastAdWatchedAt]);

  const adsWatchedThisHour = adLog.filter(t => Date.now() - t < 3600000).length;
  const canWatchAd = secondsUntilAdReady === 0 && adsWatchedThisHour < MAX_ADS_PER_HOUR;

  const login = async (newUser: User) => {
    setUser(newUser);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
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
    const newLog = [...adLog.filter(t => Date.now() - t < 3600000), now];
    setAdLog(newLog);
    await AsyncStorage.setItem('adLog', JSON.stringify(newLog));
  };

  const onAdWatched = async (): Promise<{ poolLocked: boolean }> => {
    await resetAdTimer();
    if (isPoolLocked) {
      await awardTokens(TOKENS_PER_AD);
      return { poolLocked: true };
    }
    await awardTokens(TOKENS_PER_AD);
    return { poolLocked: false };
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
        login,
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
