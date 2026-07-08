import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface WalletCardProps {
  tokens: number;
  tickets: number;
}

export default function WalletCard({ tokens, tickets }: WalletCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Gold gradient overlay strip */}
      <View style={[styles.topStrip, { backgroundColor: colors.gold + '22' }]} />

      <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>REWARD HUB WALLET</Text>

      <View style={styles.row}>
        <View style={styles.metricBlock}>
          <View style={styles.iconLabel}>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={colors.gold} />
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Tokens</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.gold }]}>
            {tokens.toLocaleString()}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.metricBlock}>
          <View style={styles.iconLabel}>
            <FontAwesome5 name="ticket-alt" size={16} color={colors.accent} />
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Tickets</Text>
          </View>
          <Text style={[styles.metricValue, { color: colors.accent }]}>
            {tickets.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.gold, width: `${Math.min(100, (tokens / 5000) * 100)}%` },
          ]}
        />
      </View>
      <Text style={[styles.progressHint, { color: colors.mutedForeground }]}>
        {Math.max(0, 5000 - tokens).toLocaleString()} tokens to first Gift Voucher
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    overflow: 'hidden',
  },
  topStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  metricBlock: {
    flex: 1,
    gap: 6,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  metricValue: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  divider: {
    width: 1,
    height: 56,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: -6,
  },
});
