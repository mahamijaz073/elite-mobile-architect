import React, { useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { SPIN_SEGMENTS } from '@/constants/mockData';

interface SpinWheelProps {
  onSpinComplete: (tokens: number, label: string) => void;
  canSpin: boolean;
  requiresAd: boolean;
  onAdRequired: () => void;
}

const WHEEL_SIZE = 260;
const RADIUS = WHEEL_SIZE / 2;
const NUM_SEGMENTS = SPIN_SEGMENTS.length;
const ANGLE_PER_SEGMENT = 360 / NUM_SEGMENTS;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function segmentPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export default function SpinWheel({ onSpinComplete, canSpin, requiresAd, onAdRequired }: SpinWheelProps) {
  const colors = useColors();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSpin = () => {
    if (isSpinning) return;
    if (requiresAd) {
      onAdRequired();
      return;
    }
    if (!canSpin) return;

    const winIndex = Math.floor(Math.random() * NUM_SEGMENTS);
    const baseRotations = 5 * 360;
    const landingAngle = winIndex * ANGLE_PER_SEGMENT + ANGLE_PER_SEGMENT / 2;
    // Pointer is at top (0deg). Wheel rotates clockwise. To land segment winIndex under pointer:
    const targetAdditional = baseRotations + (360 - landingAngle);
    const target = currentRotation.current + targetAdditional;

    setIsSpinning(true);
    spinAnim.setValue(currentRotation.current);

    Animated.timing(spinAnim, {
      toValue: target,
      duration: 4200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      currentRotation.current = target % 360;
      spinAnim.setValue(currentRotation.current);
      const segment = SPIN_SEGMENTS[winIndex];
      setIsSpinning(false);
      onSpinComplete(segment.tokens, segment.label);
    });
  };

  const spin = spinAnim.interpolate({
    inputRange: [-9999, 9999],
    outputRange: ['-9999deg', '9999deg'],
  });

  const cx = RADIUS;
  const cy = RADIUS;
  const innerR = 28;

  return (
    <View style={styles.container}>
      {/* Pointer arrow */}
      <View style={[styles.pointer, { borderBottomColor: colors.gold }]} />

      {/* Wheel */}
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
          <G>
            {SPIN_SEGMENTS.map((seg, i) => {
              const startAngle = i * ANGLE_PER_SEGMENT;
              const endAngle = startAngle + ANGLE_PER_SEGMENT;
              const midAngle = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
              const labelR = RADIUS * 0.65;
              const lx = cx + labelR * Math.cos(midAngle);
              const ly = cy + labelR * Math.sin(midAngle);
              return (
                <G key={i}>
                  <Path
                    d={segmentPath(cx, cy, RADIUS - 4, startAngle, endAngle)}
                    fill={seg.color}
                    stroke="#0A0A14"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={lx}
                    y={ly + 5}
                    fill={seg.textColor}
                    fontSize={seg.tokens >= 100 ? 13 : 15}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {seg.label}
                  </SvgText>
                </G>
              );
            })}
          </G>
          {/* Center hub */}
          <Path
            d={`M ${cx} ${cy} m -${innerR} 0 a ${innerR} ${innerR} 0 1 0 ${innerR * 2} 0 a ${innerR} ${innerR} 0 1 0 -${innerR * 2} 0`}
            fill="#0A0A14"
            stroke={colors.gold}
            strokeWidth={3}
          />
        </Svg>
      </Animated.View>

      {/* Spin button */}
      <TouchableOpacity
        style={[
          styles.spinBtn,
          {
            backgroundColor: canSpin ? colors.gold : colors.muted,
            opacity: isSpinning ? 0.6 : 1,
          },
        ]}
        onPress={handleSpin}
        disabled={isSpinning || !canSpin}
        activeOpacity={0.8}
      >
        {requiresAd ? (
          <View style={styles.btnInner}>
            <MaterialCommunityIcons name="play-circle-outline" size={20} color={canSpin ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[styles.spinBtnText, { color: canSpin ? colors.primaryForeground : colors.mutedForeground }]}>
              Watch to Spin
            </Text>
          </View>
        ) : (
          <Text style={[styles.spinBtnText, { color: canSpin ? colors.primaryForeground : colors.mutedForeground }]}>
            {isSpinning ? 'Spinning...' : 'SPIN'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 10,
    marginBottom: -4,
  },
  spinBtn: {
    height: 52,
    paddingHorizontal: 40,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
});
