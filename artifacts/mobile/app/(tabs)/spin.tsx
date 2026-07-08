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
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import SpinWheel from '@/components/SpinWheel';
import AdModal from '@/components/AdModal';
import TokenModal from '@/components/TokenModal';

export default function SpinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { awardTokens, recordSpin, dailySpinsUsed, maxFreeSpins, requireAuth, user } = useApp();

  const [showAdModal, setShowAdModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [wonTokens, setWonTokens] = useState(0);
  const [spinResult, setSpinResult] = useState<{ tokens: number; label: string } | null>(null);
  const [adGrantedSpin, setAdGrantedSpin] = useState(false);

  const freeSpinsLeft = Math.max(0, maxFreeSpins - dailySpinsUsed);
  const requiresAd = freeSpinsLeft === 0 && !adGrantedSpin;

  const handleSpinComplete = async (tokens: number, label: string) => {
    if (adGrantedSpin) setAdGrantedSpin(false);
    await recordSpin();
    if (tokens > 0) await awardTokens(tokens);
    setWonTokens(tokens);
    if (tokens > 0) setShowTokenModal(true);
    else setSpinResult({ tokens, label });
  };

  const handleAdRequired = () => {
    // requireAuth gates this too — if somehow called without auth, protect it
    requireAuth(() => setShowAdModal(true));
  };

  const handleAdComplete = () => {
    setShowAdModal(false);
    setAdGrantedSpin(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Spin the Wheel</Text>
        <View style={[styles.spinsBadge, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '44' }]}>
          <MaterialCommunityIcons name="refresh-circle" size={16} color={colors.gold} />
          <Text style={[styles.spinsText, { color: colors.gold }]}>{freeSpinsLeft} free left</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily spin indicator */}
        <View style={[styles.spinsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {Array.from({ length: maxFreeSpins }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.spinDot,
                { backgroundColor: i < dailySpinsUsed ? colors.muted : colors.gold, borderColor: i < dailySpinsUsed ? colors.border : colors.gold },
              ]}
            />
          ))}
          {adGrantedSpin && <View style={[styles.spinDot, { backgroundColor: colors.accent, borderColor: colors.accent }]} />}
          <Text style={[styles.spinsStatus, { color: colors.mutedForeground }]}>
            {adGrantedSpin
              ? 'Ad-granted spin ready!'
              : freeSpinsLeft > 0
              ? `${freeSpinsLeft} free spin${freeSpinsLeft !== 1 ? 's' : ''} today`
              : 'Watch a video for an extra spin'}
          </Text>
        </View>

        {/* Wheel — transparent overlay gates auth when user is not signed in */}
        <View style={[styles.wheelSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SpinWheel
            onSpinComplete={handleSpinComplete}
            canSpin={freeSpinsLeft > 0 || adGrantedSpin}
            requiresAd={requiresAd}
            onAdRequired={handleAdRequired}
          />
          {/* Auth overlay: intercepts the first tap when not logged in */}
          {!user && (
            <TouchableOpacity
              style={[styles.authOverlay, { backgroundColor: 'transparent' }]}
              onPress={() => requireAuth(() => {})}
              activeOpacity={1}
            />
          )}
        </View>

        {spinResult && spinResult.tokens === 0 && (
          <View style={[styles.resultCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={24} color={colors.mutedForeground} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>Try Tomorrow!</Text>
              <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>Spin again tomorrow for more chances.</Text>
            </View>
            <TouchableOpacity onPress={() => setSpinResult(null)}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.legend, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.legendTitle, { color: colors.mutedForeground }]}>PRIZE TABLE</Text>
          <View style={styles.legendGrid}>
            {[
              { label: '8 Tokens', color: '#F5C842', chance: '25%' },
              { label: '12 Tokens', color: '#2ED573', chance: '25%' },
              { label: '25 Tokens', color: '#FF6B35', chance: '12.5%' },
              { label: '40 Tokens', color: '#FF4757', chance: '12.5%' },
              { label: 'Try Tomorrow', color: '#6C3FE8', chance: '25%' },
            ].map(item => (
              <View key={item.label} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.legendChance, { color: colors.mutedForeground }]}>{item.chance}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.rulesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
          <Text style={[styles.rulesText, { color: colors.mutedForeground }]}>
            3 free spins reset at midnight. Watch a video to earn one extra spin.
          </Text>
        </View>
      </ScrollView>

      <AdModal visible={showAdModal} onComplete={handleAdComplete} onDismiss={() => setShowAdModal(false)} />
      <TokenModal visible={showTokenModal} tokens={wonTokens} onClose={() => setShowTokenModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  spinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  spinsText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, alignItems: 'center' },
  spinsBar: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 8,
  },
  spinDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  spinsStatus: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  wheelSection: {
    width: '100%', borderRadius: 24, borderWidth: 1,
    padding: 24, alignItems: 'center',
    // Needed for the auth overlay to be positioned correctly
    position: 'relative',
  },
  authOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
  },
  resultCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 12,
  },
  resultTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  resultSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  legend: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  legendTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5 },
  legendGrid: { gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  legendChance: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  rulesCard: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 10,
  },
  rulesText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
