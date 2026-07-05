import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface TokenModalProps {
  visible: boolean;
  tokens: number;
  message?: string;
  onClose: () => void;
}

export default function TokenModal({ visible, tokens, message, onClose }: TokenModalProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.6);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.gold + '88' },
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <View style={[styles.iconRing, { borderColor: colors.gold }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={36} color={colors.gold} />
          </View>
          <Text style={[styles.tokenAmount, { color: colors.gold }]}>+{tokens}</Text>
          <Text style={[styles.tokenLabel, { color: colors.foreground }]}>Tokens Added</Text>
          {message ? (
            <View style={[styles.msgBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.msgText, { color: colors.foreground }]}>{message}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.gold }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.closeBtnText, { color: colors.primaryForeground }]}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000BB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 28,
    alignItems: 'center',
    gap: 14,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenAmount: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  tokenLabel: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  msgBox: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  msgText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    textAlign: 'center',
  },
  closeBtn: {
    height: 52,
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  closeBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
