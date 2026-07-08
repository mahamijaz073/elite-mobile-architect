import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { db } from '@/lib/firebase';

type PaymentMethod = 'jazzcash' | 'easypaisa';

const METHODS: { key: PaymentMethod; label: string; color: string; icon: string }[] = [
  { key: 'jazzcash', label: 'JazzCash', color: '#FF6B00', icon: 'cash-multiple' },
  { key: 'easypaisa', label: 'EasyPaisa', color: '#2ED573', icon: 'wallet' },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, tokens, tickets, requireAuth } = useApp();

  const [fullName, setFullName] = useState('');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'withdrawal_accounts', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setFullName(data.fullName ?? '');
          setMethod((data.method as PaymentMethod) ?? null);
          setAccountNumber(data.accountNumber ?? '');
          setSavedAt(data.updatedAt ? 'Saved' : null);
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid]);

  const doSave = async () => {
    if (!user) return;
    if (!fullName.trim() || !method || accountNumber.trim().length < 6) {
      Alert.alert('Missing info', 'Please enter your name, select a payment method, and enter a valid account number.');
      return;
    }
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'withdrawal_accounts', user.uid),
        {
          uid: user.uid,
          userName: user.name,
          fullName: fullName.trim(),
          method,
          accountNumber: accountNumber.trim(),
          tokens,
          tickets,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedAt('Saved');
      Alert.alert('Saved!', 'Your withdrawal account is saved. When you win, our admin will send your prize to this account.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save your withdrawal account. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => requireAuth(doSave);

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Withdrawal account details</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!user && (
          <View style={[styles.infoBanner, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '44' }]}>
            <Ionicons name="lock-closed-outline" size={17} color={colors.accent} />
            <Text style={[styles.infoBannerText, { color: colors.accent }]}>
              Sign in to set up your withdrawal account.
            </Text>
          </View>
        )}

        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.gold + '22' }]}>
            <Text style={[styles.avatarText, { color: colors.gold }]}>
              {user?.avatarInitials ?? '??'}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.userName, { color: colors.foreground }]} numberOfLines={1}>{user?.name ?? 'Guest'}</Text>
            <Text style={[styles.userSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {tokens.toLocaleString()} tokens · {tickets} tickets
            </Text>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Withdrawal Account</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Add your name and mobile wallet account. When you win a prize, our admin will send it to this account.
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.gold} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                placeholder="e.g. Ali Khan"
                placeholderTextColor={colors.mutedForeground}
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Payment Method</Text>
              <View style={styles.methodRow}>
                {METHODS.map(m => (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.methodBtn,
                      {
                        backgroundColor: method === m.key ? m.color + '22' : colors.muted,
                        borderColor: method === m.key ? m.color : colors.border,
                      },
                    ]}
                    onPress={() => setMethod(m.key)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name={m.icon as any} size={16} color={method === m.key ? m.color : colors.mutedForeground} />
                    <Text style={[styles.methodText, { color: method === m.key ? m.color : colors.mutedForeground }]} numberOfLines={1}>
                      {m.label}
                    </Text>
                    {method === m.key && (
                      <Ionicons name="checkmark-circle" size={15} color={m.color} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 12 }]}>
                {method === 'jazzcash' ? 'JazzCash' : method === 'easypaisa' ? 'EasyPaisa' : 'Account'} Number
              </Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                placeholder="e.g. 03001234567"
                placeholderTextColor={colors.mutedForeground}
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.gold, opacity: saving ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={16} color={colors.primaryForeground} />
                    <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                      {user ? 'Save Account' : 'Sign In to Save'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {savedAt && (
                <View style={styles.savedRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={[styles.savedText, { color: colors.success }]}>Account on file — ready for withdrawals</Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={[styles.disclaimerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={15} color={colors.accent} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            Make sure your name and account number are correct. Prizes are sent only to the account saved here.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 12 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  infoBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, padding: 14, overflow: 'hidden',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  userName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  userSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  sectionSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  input: {
    height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12,
    fontSize: 14, fontFamily: 'Inter_500Medium',
  },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 10, overflow: 'hidden',
  },
  methodText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', flexShrink: 1 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: 12, marginTop: 14,
  },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'center' },
  savedText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  disclaimerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 12 },
  disclaimerText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
});
