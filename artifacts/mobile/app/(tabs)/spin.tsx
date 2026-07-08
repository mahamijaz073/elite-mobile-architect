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
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import SpinWheel from '@/components/SpinWheel';
import AdModal from '@/components/AdModal';
import TokenModal from '@/components/TokenModal';

export default function SpinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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
            paddingTop: insets.top + (Platform.OS === 'web' ? 14 : 8),
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>Spin the Wheel</Text>
        <View style={[styles.spinsBadge, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '44' }]}>
          <MaterialCommunityIcons name="refresh-circle" size={15} color={colors.gold} />
          <Text style={[styles.spinsText, { color: colors.gold }]}>{freeSpinsLeft} free</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
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
          <Text style={[styles.spinsStatus, { color: colors.mutedForeground }]} numberOfLines={1}>
            {adGrantedSpin
              ? 'Ad spin ready!'
              : freeSpinsLeft > 0
              ? `${freeSpinsLeft} free spin${freeSpinsLeft !== 1 ? 's' : ''} today`
              : 'Watch a video for extra spin'}
          </Text>
        </View>

        {/* Wheel */}
        <View style={[styles.wheelSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SpinWheel
            onSpinComplete={handleSpinComplete}
            canSpin={freeSpinsLeft > 0 || adGrantedSpin}
            requiresAd={requiresAd}
            onAdRequired={handleAdRequired}
          />
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
            <Ionicons name="time-outline" size={22} color={colors.mutedForeground} />
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
                <Text style={[styles.legendLabel, { color: colors.foreground }]} numberOfLines={1}>{item.label}</Text>
                <Text style={[styles.legendChance, { color: colors.mutedForeground }]}>{item.chance}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.rulesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
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
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 10,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', flex: 1 },
  spinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, flexShrink: 0,
  },
  spinsText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 14, alignItems: 'center' },
  spinsBar: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 12, gap: 8, overflow: 'hidden',
  },
  spinDot: { width: 13, height: 13, borderRadius: 6.5, borderWidth: 2, flexShrink: 0 },
  spinsStatus: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
  wheelSection: {
    width: '100%', borderRadius: 20, borderWidth: 1,
    padding: 16, alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  authOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 20,
  },
  resultCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, padding: 12, gap: 10,
  },
  resultTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  resultSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  legend: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  legendTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5 },
  legendGrid: { gap: 9 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 11, height: 11, borderRadius: 5.5, flexShrink: 0 },
  legendLabel: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  legendChance: { fontSize: 12, fontFamily: 'Inter_400Regular', flexShrink: 0 },
  rulesCard: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 14, borderWidth: 1, padding: 12, gap: 10,
  },
  rulesText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
});
