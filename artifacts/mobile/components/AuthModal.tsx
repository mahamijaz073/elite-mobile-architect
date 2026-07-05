/**
 * AuthModal — shown lazily when a user tries to earn tokens/redeem
 * without being signed in. Never shown on app launch.
 *
 * - Google Sign-In   → works in the web preview (signInWithPopup)
 * - Phone OTP        → works in the web preview (signInWithPhoneNumber + reCAPTCHA)
 * - Guest access     → works everywhere (signInAnonymously)
 */
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GoogleAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInAnonymously,
  signInWithCredential,
  signInWithPhoneNumber,
  signInWithPopup,
} from 'firebase/auth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '@/lib/firebase';
import { useColors } from '@/hooks/useColors';

type Screen = 'main' | 'phone' | 'otp';

const DOMAIN_ERROR_MSG =
  'This domain is not authorised in Firebase.\n\n' +
  'Go to Firebase Console → Authentication → Settings → Authorized domains → Add domain:\n\n' +
  '87d13cd3-64e1-479b-9d55-3eedf76f65ee-00-uvl2h3r1yhk4.sisko.replit.dev\n\n' +
  'Then try again. Guest access below works immediately without this step.';

interface AuthModalProps {
  visible: boolean;
  /** Called right after Firebase confirms the user is signed in. */
  onSuccess: () => void;
  onDismiss: () => void;
}

export default function AuthModal({ visible, onSuccess, onDismiss }: AuthModalProps) {
  const colors = useColors();
  const [screen, setScreen] = useState<Screen>('main');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const confirmationRef = useRef<any>(null);
  const recaptchaContainerRef = useRef<View>(null);

  const reset = () => {
    setScreen('main');
    setPhone('');
    setOtp('');
    setError('');
    setLoading(false);
  };

  const handleDismiss = () => {
    reset();
    onDismiss();
  };

  const handleSuccess = () => {
    reset();
    onSuccess();
  };

  // ── Google Sign-In ──────────────────────────────────────────────
  const handleGoogle = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Web Preview Required',
        'Google Sign-In works in the browser preview. On a physical device you will need a native build, or use Guest access below.'
      );
      return;
    }
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      handleSuccess();
    } catch (e: any) {
      if (e?.code === 'auth/unauthorized-domain') {
        setError(DOMAIN_ERROR_MSG);
      } else {
        setError(e?.message ?? 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Phone — send OTP ────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!phone.trim()) { setError('Enter your phone number with country code.'); return; }
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Web Preview Required',
        'Phone OTP works in the browser preview. Use Guest access on a physical device for now.'
      );
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Invisible reCAPTCHA — Firebase needs a DOM container
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-anchor', { size: 'invisible' });
      confirmationRef.current = await signInWithPhoneNumber(auth, phone.trim(), verifier);
      setScreen('otp');
    } catch (e: any) {
      if (e?.code === 'auth/unauthorized-domain') {
        setError(DOMAIN_ERROR_MSG);
      } else {
        setError(e?.message ?? 'Failed to send OTP. Check number format (+923001234567).');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Phone — verify OTP ──────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError('Enter the 6-digit code.'); return; }
    setLoading(true);
    setError('');
    try {
      await confirmationRef.current.confirm(otp.trim());
      handleSuccess();
    } catch (e: any) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Anonymous / Guest ───────────────────────────────────────────
  const handleGuest = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
      handleSuccess();
    } catch (e: any) {
      if (e?.code === 'auth/unauthorized-domain') {
        setError(DOMAIN_ERROR_MSG);
      } else {
        setError(e?.message ?? 'Could not sign in anonymously.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleDismiss}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleDismiss} activeOpacity={1} />

        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Close */}
          <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* ── MAIN SCREEN ── */}
          {screen === 'main' && (
            <>
              <View style={styles.iconRow}>
                <View style={[styles.iconBg, { backgroundColor: colors.gold + '22' }]}>
                  <MaterialCommunityIcons name="lock-open-outline" size={32} color={colors.gold} />
                </View>
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Sign in to Continue</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Create an account or sign in to collect tokens, spin the wheel, and redeem prizes.
              </Text>

              {error !== '' && (
                <View style={[styles.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' }]}>
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#4285F4' }]}
                onPress={handleGoogle}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="google" size={20} color="#fff" />
                    <Text style={styles.primaryBtnText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                onPress={() => { setError(''); setScreen('phone'); }}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="phone-portrait-outline" size={20} color={colors.foreground} />
                <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Continue with Phone</Text>
              </TouchableOpacity>

              <View style={[styles.divider, { borderColor: colors.border }]}>
                <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
              </View>

              <TouchableOpacity
                style={[styles.guestBtn]}
                onPress={handleGuest}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Ionicons name="person-outline" size={18} color={colors.mutedForeground} />
                <Text style={[styles.guestText, { color: colors.mutedForeground }]}>
                  Quick Guest Access
                </Text>
              </TouchableOpacity>
              <Text style={[styles.guestNote, { color: colors.mutedForeground }]}>
                Guest accounts can't redeem prizes — sign in to unlock full rewards.
              </Text>

              {/* Invisible reCAPTCHA anchor for phone auth */}
              <View nativeID="recaptcha-anchor" ref={recaptchaContainerRef} style={styles.recaptcha} />
            </>
          )}

          {/* ── PHONE SCREEN ── */}
          {screen === 'phone' && (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('main')}>
                <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
                <Text style={[styles.backText, { color: colors.mutedForeground }]}>Back</Text>
              </TouchableOpacity>

              <Text style={[styles.title, { color: colors.foreground }]}>Enter Phone Number</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                We'll send a 6-digit OTP to verify your number.
              </Text>

              {error !== '' && (
                <View style={[styles.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' }]}>
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                </View>
              )}

              <TextInput
                style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                placeholder="+92 300 1234567"
                placeholderTextColor={colors.mutedForeground}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.gold, opacity: loading ? 0.6 : 1 }]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Send OTP</Text>
                )}
              </TouchableOpacity>

              <View nativeID="recaptcha-anchor" ref={recaptchaContainerRef} style={styles.recaptcha} />
            </>
          )}

          {/* ── OTP SCREEN ── */}
          {screen === 'otp' && (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('phone')}>
                <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
                <Text style={[styles.backText, { color: colors.mutedForeground }]}>Back</Text>
              </TouchableOpacity>

              <Text style={[styles.title, { color: colors.foreground }]}>Enter OTP</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                A 6-digit code was sent to {phone}
              </Text>

              {error !== '' && (
                <View style={[styles.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' }]}>
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                </View>
              )}

              <TextInput
                style={[styles.input, styles.otpInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
                placeholder="000000"
                placeholderTextColor={colors.mutedForeground}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.gold, opacity: loading ? 0.6 : 1 }]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Verify & Sign In</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#000000AA',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    gap: 14,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  closeBtn: { position: 'absolute', top: 16, right: 20, padding: 6, zIndex: 10 },
  iconRow: { alignItems: 'center', marginTop: 8 },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  errorBox: { borderWidth: 1, borderRadius: 12, padding: 12 },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  secondaryBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  divider: {
    borderTopWidth: 1,
    alignItems: 'center',
    marginVertical: 2,
  },
  dividerText: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: -8, paddingHorizontal: 12, backgroundColor: 'transparent' },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  guestText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  guestNote: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 15 },
  recaptcha: { height: 0, overflow: 'hidden' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  backText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  otpInput: { textAlign: 'center', fontSize: 28, letterSpacing: 8, fontFamily: 'Inter_700Bold' },
});
