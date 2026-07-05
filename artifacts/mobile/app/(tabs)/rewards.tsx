import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

interface RewardTier {
  label: string;
  amount: string;
  method: string;
  tokensRequired: number;
  icon: string;
  color: string;
}

const REWARD_TIERS: RewardTier[] = [
  { label: 'Rs. 500 Gift Voucher', amount: 'Rs. 500', method: 'EasyPaisa', tokensRequired: 5000, icon: 'gift', color: '#2ED573' },
  { label: 'Rs. 1000 Gift Voucher', amount: 'Rs. 1,000', method: 'JazzCash', tokensRequired: 10000, icon: 'award', color: '#F5C842' },
];

export default function RewardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tokens, isPoolLocked, requireAuth, user } = useApp();

  const doRedeem = (tier: RewardTier) => {
    if (isPoolLocked || tokens < tier.tokensRequired) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Redeem Voucher',
      `You are about to redeem ${tier.amount} via ${tier.method}.\n\nPayouts are processed within 24–48 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () =>
            Alert.alert('Redemption Submitted!', 'Your voucher request is under review. You will receive your Gift Voucher within 48 hours.'),
        },
      ]
    );
  };

  const handleRedeem = (tier: RewardTier) => {
    requireAuth(() => doRedeem(tier));
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
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Claim Rewards</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Redeem tokens for Gift Vouchers</Text>
        </View>
        <View style={[styles.tokenChip, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '55' }]}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.gold} />
          <Text style={[styles.tokenChipText, { color: colors.gold }]}>{tokens.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Guest banner */}
        {!user && (
          <View style={[styles.infoBanner, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '44' }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.accent} />
            <Text style={[styles.infoBannerText, { color: colors.accent }]}>
              Sign in to redeem your tokens for real prizes.
            </Text>
          </View>
        )}

        {isPoolLocked && (
          <View style={[styles.lockedBanner, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' }]}>
            <Ionicons name="lock-closed" size={20} color={colors.destructive} />
            <Text style={[styles.lockedText, { color: colors.destructive }]}>
              Today's Reward Pool is at capacity. Keep collecting tokens for tomorrow's draw!
            </Text>
          </View>
        )}

        {/* Balance */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.gold + '44' }]}>
          <View style={styles.balanceTop}>
            <View>
              <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>AVAILABLE TOKENS</Text>
              <Text style={[styles.balanceAmount, { color: colors.gold }]}>{tokens.toLocaleString()}</Text>
            </View>
            <View style={[styles.balanceIcon, { backgroundColor: colors.gold + '22' }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={32} color={colors.gold} />
            </View>
          </View>
          <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.gold, width: `${Math.min(100, (tokens / 5000) * 100)}%` }]} />
          </View>
          <View style={styles.milestoneRow}>
            <Text style={[styles.milestoneText, { color: colors.mutedForeground }]}>0</Text>
            <Text style={[styles.milestoneText, { color: colors.mutedForeground }]}>5,000</Text>
            <Text style={[styles.milestoneText, { color: colors.mutedForeground }]}>10,000</Text>
          </View>
        </View>

        {/* How it works */}
        <View style={[styles.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How to Redeem</Text>
          {[
            { step: '1', text: 'Collect tokens by playing, spinning, and watching videos.' },
            { step: '2', text: 'Sign in, then tap "Redeem Voucher" on a tier below.' },
            { step: '3', text: 'Receive your Gift Voucher via EasyPaisa or JazzCash within 48 hours.' },
          ].map(item => (
            <View key={item.step} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.accent + '33' }]}>
                <Text style={[styles.stepNum, { color: colors.accent }]}>{item.step}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.mutedForeground }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.tiersLabel, { color: colors.mutedForeground }]}>VOUCHER TIERS</Text>

        {REWARD_TIERS.map(tier => {
          const canRedeem = user && tokens >= tier.tokensRequired && !isPoolLocked;
          const deficit = Math.max(0, tier.tokensRequired - tokens);
          const progress = Math.min(1, tokens / tier.tokensRequired);

          return (
            <View
              key={tier.label}
              style={[
                styles.tierCard,
                { backgroundColor: colors.card, borderColor: canRedeem ? tier.color + '88' : colors.border },
              ]}
            >
              {isPoolLocked && (
                <View style={styles.lockedOverlay}>
                  <Ionicons name="lock-closed" size={18} color={colors.mutedForeground} />
                </View>
              )}
              <View style={styles.tierTop}>
                <View style={[styles.tierIconBox, { backgroundColor: tier.color + '22' }]}>
                  <FontAwesome5 name={tier.icon as any} size={22} color={tier.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tierAmount, { color: tier.color }]}>{tier.amount}</Text>
                  <Text style={[styles.tierLabel, { color: colors.foreground }]}>{tier.label}</Text>
                  <View style={styles.methodRow}>
                    <MaterialCommunityIcons name="bank-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.methodText, { color: colors.mutedForeground }]}>Via {tier.method}</Text>
                  </View>
                </View>
                <View style={[styles.costBadge, { backgroundColor: colors.muted }]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={12} color={colors.gold} />
                  <Text style={[styles.costText, { color: colors.gold }]}>{tier.tokensRequired.toLocaleString()}</Text>
                </View>
              </View>

              <View style={[styles.tierProgressBg, { backgroundColor: colors.muted }]}>
                <View style={[styles.tierProgressFill, { backgroundColor: tier.color, width: `${progress * 100}%` }]} />
              </View>
              <Text style={[styles.tierProgressText, { color: colors.mutedForeground }]}>
                {canRedeem ? 'Ready to redeem!' : !user ? 'Sign in to redeem' : `${deficit.toLocaleString()} more tokens needed`}
              </Text>

              <TouchableOpacity
                style={[styles.redeemBtn, { backgroundColor: canRedeem ? tier.color : colors.muted }]}
                onPress={() => handleRedeem(tier)}
                activeOpacity={0.8}
              >
                <Text style={[styles.redeemBtnText, { color: canRedeem ? '#fff' : colors.mutedForeground }]}>
                  {isPoolLocked ? 'Pool Locked' : !user ? 'Sign In to Redeem' : canRedeem ? 'Redeem Voucher' : 'Not enough tokens'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={[styles.disclaimerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            All Gift Vouchers are processed by our team. Vouchers are awarded for token collection. Terms apply.
          </Text>
        </View>
      </ScrollView>
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
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  tokenChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  tokenChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
  infoBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  lockedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
  lockedText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  balanceCard: { borderRadius: 20, borderWidth: 1.5, padding: 20, gap: 12 },
  balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5 },
  balanceAmount: { fontSize: 42, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
  balanceIcon: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  milestoneRow: { flexDirection: 'row', justifyContent: 'space-between' },
  milestoneText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  howCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNum: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  stepText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  tiersLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5, marginTop: 2 },
  tierCard: { borderRadius: 20, borderWidth: 1.5, padding: 18, gap: 12 },
  lockedOverlay: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  tierTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierIconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tierAmount: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  tierLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  methodText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  costBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  costText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tierProgressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  tierProgressFill: { height: '100%', borderRadius: 3 },
  tierProgressText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  redeemBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  redeemBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  disclaimerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  disclaimerText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
});
