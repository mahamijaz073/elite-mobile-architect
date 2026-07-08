import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface AdModalProps {
  visible: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

type AdPhase = 'loading' | 'playing' | 'complete';

const AD_DURATION = 5;

export default function AdModal({ visible, onComplete, onDismiss }: AdModalProps) {
  const colors = useColors();
  const [phase, setPhase] = useState<AdPhase>('loading');
  const [countdown, setCountdown] = useState(AD_DURATION);
  const loadAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) {
      setPhase('loading');
      setCountdown(AD_DURATION);
      loadAnim.setValue(0);
      progressAnim.setValue(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setPhase('loading');
    // Simulate loading
    Animated.timing(loadAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start(() => {
      setPhase('playing');
      setCountdown(AD_DURATION);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: AD_DURATION * 1000,
        useNativeDriver: false,
      }).start();

      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setPhase('complete');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {phase === 'loading' && (
            <View style={styles.phaseContent}>
              <MaterialCommunityIcons name="television-play" size={48} color={colors.gold} />
              <Text style={[styles.phaseTitle, { color: colors.foreground }]}>Loading Reward Ad</Text>
              <Text style={[styles.phaseSubtitle, { color: colors.mutedForeground }]}>
                Watch the full ad to collect your tokens
              </Text>
              <View style={[styles.loadBar, { backgroundColor: colors.muted }]}>
                <Animated.View
                  style={[
                    styles.loadFill,
                    { backgroundColor: colors.gold, width: loadAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                  ]}
                />
              </View>
            </View>
          )}

          {phase === 'playing' && (
            <View style={styles.phaseContent}>
              {/* Simulated ad frame */}
              <View style={[styles.adFrame, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="play-circle" size={40} color={colors.mutedForeground} />
                <Text style={[styles.adFrameText, { color: colors.mutedForeground }]}>Ad Playing</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                <Animated.View style={[styles.progressFill, { backgroundColor: colors.gold, width: progressWidth }]} />
              </View>
              <Text style={[styles.countdownText, { color: colors.mutedForeground }]}>
                Reward unlocks in {countdown}s
              </Text>
            </View>
          )}

          {phase === 'complete' && (
            <View style={styles.phaseContent}>
              <View style={[styles.successRing, { borderColor: colors.success }]}>
                <Ionicons name="checkmark" size={36} color={colors.success} />
              </View>
              <Text style={[styles.phaseTitle, { color: colors.foreground }]}>Reward Unlocked!</Text>
              <Text style={[styles.phaseSubtitle, { color: colors.mutedForeground }]}>
                50 tokens are being added to your wallet
              </Text>
              <TouchableOpacity
                style={[styles.claimBtn, { backgroundColor: colors.gold }]}
                onPress={onComplete}
                activeOpacity={0.8}
              >
                <Text style={[styles.claimBtnText, { color: colors.primaryForeground }]}>Collect Tokens</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase !== 'complete' && (
            <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000CC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  phaseContent: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  phaseTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  phaseSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  loadFill: { height: '100%', borderRadius: 3 },
  adFrame: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adFrameText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  countdownText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  successRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtn: {
    height: 52,
    paddingHorizontal: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    width: '100%',
  },
  claimBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
});
