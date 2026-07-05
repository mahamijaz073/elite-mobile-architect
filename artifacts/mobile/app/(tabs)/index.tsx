import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
  const { user, tokens, tickets, secondsUntilAdReady, canWatchAd, adsWatchedThisHour, maxAdsPerHour, isPoolLocked, onAdWatched } = useApp();
  const [showAd, setShowAd] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [poolLockedModal, setPoolLockedModal] = useState(false);

  const handleWatchAd = () => {
    if (!canWatchAd) return;
    setShowAd(true);
  };

  const handleAdComplete = async () => {
    setShowAd(false);
    const result = await onAdWatched();
    if (result.poolLocked) {
      setPoolLockedModal(true);
    } else {
      setShowToken(true);
    }
  };

  const frequencyReached = adsWatchedThisHour >= maxAdsPerHour;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 8),
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.accent + '33' }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>
              {user?.avatarInitials ?? 'QP'}
            </Text>
          </View>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Welcome back</Text>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name ?? 'Player'}</Text>
          </View>
        </View>
        <View style={[styles.tokenBadge, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '55' }]}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.gold} />
          <Text style={[styles.tokenBadgeText, { color: colors.gold }]}>{tokens.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet */}
        <WalletCard tokens={tokens} tickets={tickets} />

        {/* 20-min timer section */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Video Reward Timer</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            Watch a video every 20 minutes to collect 50 tokens.
          </Text>

          <View style={styles.timerRow}>
            <CountdownTimer secondsRemaining={secondsUntilAdReady} totalSeconds={1200} size={140} />
            <View style={styles.timerInfo}>
              <View style={[styles.infoRow, { backgroundColor: colors.muted, borderRadius: 10, padding: 10, gap: 6 }]}>
                <Ionicons name="film-outline" size={16} color={colors.gold} />
                <Text style={[styles.infoText, { color: colors.foreground }]}>
                  {adsWatchedThisHour}/{maxAdsPerHour} ads this hour
                </Text>
              </View>
              <View style={[styles.infoRow, { backgroundColor: colors.muted, borderRadius: 10, padding: 10, gap: 6 }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.success} />
                <Text style={[styles.infoText, { color: colors.foreground }]}>
                  +50 tokens per view
                </Text>
              </View>
            </View>
          </View>

          {frequencyReached ? (
            <View style={[styles.warningBanner, { backgroundColor: colors.destructive + '22', borderColor: colors.destructive + '44' }]}>
              <Ionicons name="warning-outline" size={16} color={colors.destructive} />
              <Text style={[styles.warningText, { color: colors.destructive }]}>
                Maximum frequency reached. Please try again after 1 hour.
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.watchBtn,
                {
                  backgroundColor: canWatchAd ? colors.gold : colors.muted,
                  opacity: canWatchAd ? 1 : 0.6,
                },
              ]}
              onPress={handleWatchAd}
              disabled={!canWatchAd}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="play-circle-outline"
                size={22}
                color={canWatchAd ? colors.primaryForeground : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.watchBtnText,
                  { color: canWatchAd ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                Watch Video &amp; Claim Tokens
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick links */}
        <Text style={[styles.quickLinksTitle, { color: colors.mutedForeground }]}>MODULES</Text>
        <View style={styles.quickLinks}>
          {[
            { icon: 'brain', label: 'Brain Quiz', color: '#6C3FE8', route: 'play' },
            { icon: 'puzzle-outline', label: 'Captcha', color: '#2ED573', route: 'play' },
            { icon: 'refresh-circle-outline', label: 'Spin Wheel', color: '#F5C842', route: 'spin' },
            { icon: 'newspaper-outline', label: 'Reward Hub', color: '#FF6B35', route: 'feed' },
          ].map((item) => (
            <View
              key={item.label}
              style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.quickIcon, { backgroundColor: item.color + '22' }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <AdModal
        visible={showAd}
        onComplete={handleAdComplete}
        onDismiss={() => setShowAd(false)}
      />

      <TokenModal
        visible={showToken}
        tokens={50}
        onClose={() => setShowToken(false)}
      />

      {/* Pool Locked Modal */}
      <TokenModal
        visible={poolLockedModal}
        tokens={50}
        message="Today's cash prize pool is full! However, 50 Bonus Tokens have been credited to your wallet for tomorrow's Mega Draw!"
        onClose={() => setPoolLockedModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  greeting: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  userName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tokenBadgeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  sectionSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  timerInfo: { flex: 1, gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  watchBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  watchBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  warningText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1, lineHeight: 18 },
  quickLinksTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5, marginTop: 4 },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '47%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
