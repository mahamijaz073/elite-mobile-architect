import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface CountdownTimerProps {
  secondsRemaining: number;
  totalSeconds?: number;
  size?: number;
}

export default function CountdownTimer({
  secondsRemaining,
  totalSeconds = 1200,
  size = 140,
}: CountdownTimerProps) {
  const colors = useColors();
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = secondsRemaining === 0 ? 1 : 1 - secondsRemaining / totalSeconds;
  const dashOffset = circumference * (1 - progress);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const ringColor =
    secondsRemaining === 0
      ? colors.success
      : secondsRemaining < 120
      ? colors.destructive
      : colors.gold;

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.muted}
          strokeWidth={10}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={ringColor}
          strokeWidth={10}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>
      <View style={[styles.center, { width: size, height: size }]}>
        {secondsRemaining === 0 ? (
          <>
            <Text style={[styles.readyLabel, { color: colors.success }]}>READY</Text>
            <Text style={[styles.readySubLabel, { color: colors.mutedForeground }]}>Tap to claim</Text>
          </>
        ) : (
          <>
            <Text style={[styles.timeText, { color: colors.foreground }]}>{timeStr}</Text>
            <Text style={[styles.nextAdLabel, { color: colors.mutedForeground }]}>next reward</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {},
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  nextAdLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  readyLabel: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  readySubLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
