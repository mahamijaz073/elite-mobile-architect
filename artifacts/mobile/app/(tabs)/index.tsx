import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import WalletCard from '@/components/WalletCard';
import CountdownTimer from '@/components/CountdownTimer';
import AdModal from '@/components/AdModal';
import TokenModal from '@/components/TokenModal';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    user, tokens, tickets,
    secondsUntilAdReady, canWatchAd,
    isPoolLocked, onAdWatched, requireAuth,
  } = useApp();

  const [showAd, setShowAd] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [poolLockedModal, setPoolLockedModal] = useState(false);

  const handleWatchAd = () => {
    requireAuth(() => {
      if (!canWatchAd) return;
      setShowAd(true);
    });
  };

  const handleAdComplete = async () => {
    setShowAd(false);
    const result = await onAdWatched();
    if (result.poolLocked) setPoolLockedModal(true);
    else setShowToken(true);
  };

  const timerSize = width < 380 ? 100 : 130;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 14 : 8),
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.accent + '33' }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>
              {user?.avatarInitials ?? '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]} numberOfLines={1}>
              {user ? `Welcome back` : 'QuizBox'}
            </Text>
            <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>
              {user?.name ?? 'Play & Win Prizes'}
            </Text>
          </View>
        </View>
        <View style={[styles.tokenBadge, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '55' }]}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.gold} />
          <Text style={[styles.tokenBadgeText, { color: colors.gold }]}>{tokens.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {!user && (
          <View style={[styles.guestBanner, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '44' }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
            <Text style={[styles.guestBannerText, { color: colors.accent }]}>
              Sign in when you're ready to collect tokens and redeem prizes.
            </Text>
          </View>
        )}

        <WalletCard tokens={tokens} tickets={tickets} />

        {/* 1-hour video timer section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Video Reward Timer</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            Watch 1 video per hour — no daily limit. Earn 25 tokens each time.
          </Text>

          <View style={styles.timerRow}>
            <CountdownTimer secondsRemaining={secondsUntilAdReady} totalSeconds={3600} size={timerSize} />
            <View style={styles.timerInfo}>
              <View style={[styles.infoPill, { backgroundColor: colors.muted }]}>
                <Ionicons name="time-outline" size={14} color={colors.accent} />
                <Text style={[styles.infoText, { color: colors.foreground }]} numberOfLines={1}>1 video / hour</Text>
              </View>
              <View style={[styles.infoPill, { backgroundColor: colors.muted }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.success} />
                <Text style={[styles.infoText, { color: colors.foreground }]} numberOfLines={1}>+25 tokens</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.watchBtn,
              { backgroundColor: canWatchAd ? colors.gold : colors.muted, opacity: canWatchAd ? 1 : 0.6 },
            ]}
            onPress={handleWatchAd}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={20}
              color={canWatchAd ? colors.primaryForeground : colors.mutedForeground}
            />
            <Text style={[styles.watchBtnText, { color: canWatchAd ? colors.primaryForeground : colors.mutedForeground }]}>
              Watch Video & Claim Tokens
            </Text>
          </TouchableOpacity>
        </View>

        {/* Module shortcuts */}
        <Text style={[styles.quickLinksTitle, { color: colors.mutedForeground }]}>MODULES</Text>
        <View style={styles.quickLinks}>
          {[
            { icon: 'bulb-outline', label: 'Brain Quiz', color: '#6C3FE8' },
            { icon: 'shield-checkmark-outline', label: 'Captcha', color: '#2ED573' },
            { icon: 'refresh-circle-outline', label: 'Spin Wheel', color: '#F5C842' },
            { icon: 'gift-outline', label: 'Rewards', color: '#FF6B35' },
          ].map(item => (
            <View
              key={item.label}
              style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]} numberOfLines={1}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <AdModal visible={showAd} onComplete={handleAdComplete} onDismiss={() => setShowAd(false)} />
      <TokenModal visible={showToken} tokens={50} onClose={() => setShowToken(false)} />
      <TokenModal
        visible={poolLockedModal}
        tokens={50}
        message="Today's prize pool is full! 50 Bonus Tokens added for tomorrow's Mega Draw."
        onClose={() => setPoolLockedModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  greeting: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  userName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tokenBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, flexShrink: 0,
  },
  tokenBadgeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 14 },
  guestBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 12,
  },
  guestBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  section: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12, overflow: 'hidden' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  sectionSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timerInfo: { flex: 1, gap: 8 },
  infoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
  },
  infoText: { fontSize: 12, fontFamily: 'Inter_500Medium', flexShrink: 1 },
  watchBtn: {
    height: 50, borderRadius: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  watchBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  quickLinksTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5, marginTop: 2 },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, alignItems: 'flex-start' },
  quickIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
