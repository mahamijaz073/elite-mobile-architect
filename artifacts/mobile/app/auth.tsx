import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

type Flow = 'choice' | 'phone' | 'otp';

function generateUID(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useApp();
  const [flow, setFlow] = useState<Flow>('choice');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const styles = makeStyles(colors, insets);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Simulated Google OAuth — replace with expo-auth-session + Google credentials
    setTimeout(async () => {
      await login({
        uid: generateUID(),
        name: 'QuizBox Player',
        email: 'player@quizbox.app',
        avatarInitials: 'QP',
      });
      setLoading(false);
    }, 1500);
  };

  const handleSendOTP = () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlow('otp');
  };

  const handleVerifyOTP = async () => {
    if (otp !== '123456') {
      Alert.alert('Invalid Code', 'Please enter the correct verification code.\n\nDemo code: 123456');
      return;
    }
    setLoading(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const name = `Player_${phone.slice(-4)}`;
    setTimeout(async () => {
      await login({
        uid: generateUID(),
        name,
        email: '',
        avatarInitials: name.substring(0, 2).toUpperCase(),
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background decoration */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={[styles.content, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 40) }]}>
        {/* Logo area */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoRing, { borderColor: colors.gold }]}>
            <MaterialIcons name="bolt" size={40} color={colors.gold} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>QuizBox</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Play &amp; Win · Collect Tokens · Redeem Prizes</Text>
        </View>

        {/* Auth card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {flow === 'choice' && (
            <>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Join the Reward Hub</Text>
              <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
                Sign in to start collecting tokens and claim your prizes.
              </Text>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
                onPress={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <>
                    <MaterialIcons name="language" size={20} color={colors.primaryForeground} />
                    <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
                onPress={() => setFlow('phone')}
              >
                <Ionicons name="call-outline" size={20} color={colors.foreground} />
                <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
                  Sign in with Phone
                </Text>
              </TouchableOpacity>
            </>
          )}

          {flow === 'phone' && (
            <>
              <TouchableOpacity onPress={() => setFlow('choice')} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Enter Phone Number</Text>
              <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
                We'll send a verification code to your number.
              </Text>
              <View style={[styles.inputRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Text style={[styles.countryCode, { color: colors.mutedForeground }]}>+92</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.foreground }]}
                  placeholder="3XX XXXXXXX"
                  placeholderTextColor={colors.mutedForeground}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.gold, marginTop: 8 }]}
                onPress={handleSendOTP}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Send Code</Text>
              </TouchableOpacity>
            </>
          )}

          {flow === 'otp' && (
            <>
              <TouchableOpacity onPress={() => setFlow('phone')} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Verify Code</Text>
              <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
                Enter the 6-digit code sent to +92{phone}
                {'\n'}(Demo: use 123456)
              </Text>
              <TextInput
                style={[styles.otpInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
                placeholder="• • • • • •"
                placeholderTextColor={colors.mutedForeground}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.gold, marginTop: 8 }]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Verify &amp; Play</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          By continuing, you agree to our Terms of Service.{'\n'}Token rewards subject to availability.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: { bottom: number }) {
  return StyleSheet.create({
    container: { flex: 1 },
    bgCircle1: {
      position: 'absolute', width: 300, height: 300, borderRadius: 150,
      backgroundColor: '#F5C84215', top: -80, right: -80,
    },
    bgCircle2: {
      position: 'absolute', width: 200, height: 200, borderRadius: 100,
      backgroundColor: '#6C3FE820', bottom: 100, left: -60,
    },
    content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 24 },
    logoContainer: { alignItems: 'center', gap: 10 },
    logoRing: {
      width: 80, height: 80, borderRadius: 40, borderWidth: 2,
      alignItems: 'center', justifyContent: 'center',
    },
    appName: { fontSize: 32, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
    tagline: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
    card: {
      borderRadius: 20, borderWidth: 1, padding: 24, gap: 14,
    },
    cardTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
    cardSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
    primaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      height: 52, borderRadius: 14, gap: 10,
    },
    primaryBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    divider: { flex: 1, height: 1 },
    dividerText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
    secondaryBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      height: 52, borderRadius: 14, borderWidth: 1, gap: 10,
    },
    secondaryBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
    backBtn: { padding: 4, alignSelf: 'flex-start', marginBottom: 4 },
    inputRow: {
      flexDirection: 'row', alignItems: 'center', borderRadius: 12,
      borderWidth: 1, paddingHorizontal: 14, height: 52,
    },
    countryCode: { fontSize: 16, fontFamily: 'Inter_500Medium', marginRight: 10 },
    textInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', height: '100%' },
    otpInput: {
      height: 60, borderRadius: 12, borderWidth: 1,
      fontSize: 24, fontFamily: 'Inter_600SemiBold', letterSpacing: 8,
    },
    disclaimer: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },
  });
}
