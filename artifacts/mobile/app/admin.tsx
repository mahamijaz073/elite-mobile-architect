import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '@/hooks/useColors';

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface ConfigData {
  tokenPriceRs: number;
  updatedAt: string | null;
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Create post
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [postingPost, setPostingPost] = useState(false);
  const [postError, setPostError] = useState('');

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/config/token-price`);
      const data = await res.json() as ConfigData;
      setConfig(data);
      setNewPrice(data.tokenPriceRs.toString());
    } catch {
      setError('Could not reach server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!adminKey.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Validate key against the real admin-protected endpoint.
      // price: 0 is intentionally invalid, so a correct key returns 400 (not 401).
      const testRes = await fetch(`${API_BASE}/admin/config/token-price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey.trim() },
        body: JSON.stringify({ price: 0 }),
      });
      if (testRes.status === 401) {
        setError('Wrong admin key. Try again.');
        setLoading(false);
        return;
      }
      // Key accepted (server returned 400 for price=0 which is fine)
      setIsAuthenticated(true);
      await loadConfig();
    } catch {
      setError('Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadConfig();
  }, [isAuthenticated]);

  const pickPostImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach a screenshot.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets[0]) {
      setPostImage(result.assets[0]);
    }
  };

  const handleCreatePost = async () => {
    if (!postText.trim()) {
      Alert.alert('Invalid', 'Write some post content first.');
      return;
    }
    setPostingPost(true);
    setPostError('');
    try {
      const formData = new FormData();
      formData.append('contentText', postText.trim());
      formData.append('adminName', 'QuizBox Admin');
      if (postImage) {
        const uriParts = postImage.uri.split('.');
        const ext = uriParts[uriParts.length - 1] || 'jpg';
        formData.append('image', {
          uri: postImage.uri,
          name: `post.${ext}`,
          type: postImage.mimeType ?? `image/${ext}`,
        } as any);
      }

      const res = await fetch(`${API_BASE}/admin/posts`, {
        method: 'POST',
        headers: { 'x-admin-key': adminKey.trim() },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPostText('');
      setPostImage(null);
      Alert.alert('Post Published ✓', 'Your post is now live in the Reward Hub feed.');
    } catch (e: any) {
      setPostError(e?.message ?? 'Failed to publish post.');
    } finally {
      setPostingPost(false);
    }
  };

  const handleSave = async () => {
    const parsed = parseFloat(newPrice);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert('Invalid', 'Enter a valid positive number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/config/token-price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey.trim() },
        body: JSON.stringify({ price: parsed }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      const data = await res.json() as { tokenPriceRs: number };
      setConfig(prev => prev ? { ...prev, tokenPriceRs: data.tokenPriceRs, updatedAt: new Date().toISOString() } : null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Price Updated ✓',
        `Token price is now Rs. ${data.tokenPriceRs.toFixed(2)} per token.\n\nNew redemption tiers:\n• Rs. 500 = ${Math.ceil(500 / data.tokenPriceRs).toLocaleString()} tokens\n• Rs. 1,000 = ${Math.ceil(1000 / data.tokenPriceRs).toLocaleString()} tokens`
      );
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: insets.top + (Platform.OS === 'web' ? 14 : 8),
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Admin Panel</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Token price management</Text>
        </View>
        <View style={[styles.adminBadge, { backgroundColor: '#6C3FE8' + '22', borderColor: '#6C3FE8' + '66' }]}>
          <MaterialCommunityIcons name="shield-crown-outline" size={14} color="#6C3FE8" />
          <Text style={[styles.adminBadgeText, { color: '#6C3FE8' }]}>ADMIN</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {!isAuthenticated ? (
          /* ── Auth gate ── */
          <View style={[styles.authCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: '#6C3FE8' + '22' }]}>
              <MaterialCommunityIcons name="lock-outline" size={32} color="#6C3FE8" />
            </View>
            <Text style={[styles.authTitle, { color: colors.foreground }]}>Admin Access</Text>
            <Text style={[styles.authSub, { color: colors.mutedForeground }]}>
              Enter your secret admin key to manage token pricing.
            </Text>

            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
              placeholder="Admin secret key"
              placeholderTextColor={colors.mutedForeground}
              value={adminKey}
              onChangeText={setAdminKey}
              secureTextEntry
              autoCapitalize="none"
            />

            {error ? (
              <View style={[styles.errorRow, { backgroundColor: colors.destructive + '18' }]}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#6C3FE8', opacity: loading ? 0.7 : 1 }]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Authenticate</Text>
              }
            </TouchableOpacity>
          </View>
        ) : loading && !config ? (
          <ActivityIndicator color={colors.gold} size="large" style={{ marginTop: 60 }} />
        ) : (
          /* ── Admin panel ── */
          <>
            {/* Current state */}
            <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.gold + '55' }]}>
              <Text style={[styles.statsLabel, { color: colors.mutedForeground }]}>CURRENT TOKEN PRICE</Text>
              <View style={styles.statsRow}>
                <Text style={[styles.statsValue, { color: colors.gold }]}>
                  Rs. {config?.tokenPriceRs.toFixed(2) ?? '—'}
                </Text>
                <Text style={[styles.statsUnit, { color: colors.mutedForeground }]}>per token</Text>
              </View>
              {config?.updatedAt && (
                <Text style={[styles.statsUpdated, { color: colors.mutedForeground }]}>
                  Last updated: {new Date(config.updatedAt).toLocaleString()}
                </Text>
              )}
            </View>

            {/* Implied redemption tiers */}
            {config && (
              <View style={[styles.tiersCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.tiersTitle, { color: colors.foreground }]}>Implied Redemption Tiers</Text>
                <Text style={[styles.tiersSub, { color: colors.mutedForeground }]}>
                  Based on current price of Rs. {config.tokenPriceRs.toFixed(2)}
                </Text>
                {[
                  { voucher: 'Rs. 500', tokens: Math.ceil(500 / config.tokenPriceRs) },
                  { voucher: 'Rs. 1,000', tokens: Math.ceil(1000 / config.tokenPriceRs) },
                ].map(t => (
                  <View key={t.voucher} style={[styles.tierRow, { borderColor: colors.border }]}>
                    <MaterialCommunityIcons name="gift-outline" size={16} color={colors.gold} />
                    <Text style={[styles.tierVoucher, { color: colors.foreground }]}>{t.voucher}</Text>
                    <Text style={[styles.tierTokens, { color: colors.gold }]}>
                      {t.tokens.toLocaleString()} tokens
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Edit price */}
            <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.editTitle, { color: colors.foreground }]}>Update Token Price</Text>
              <Text style={[styles.editSub, { color: colors.mutedForeground }]}>
                Set the Rs. value of 1 token. Redemption tiers update automatically for all users.
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>New price (Rs. per token)</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputPrefix, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Text style={[styles.inputPrefixText, { color: colors.mutedForeground }]}>Rs.</Text>
                </View>
                <TextInput
                  style={[styles.priceInput, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                  placeholder="e.g. 1.10"
                  placeholderTextColor={colors.mutedForeground}
                  value={newPrice}
                  onChangeText={setNewPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Preview */}
              {newPrice && parseFloat(newPrice) > 0 && (
                <View style={[styles.previewBox, { backgroundColor: colors.gold + '12', borderColor: colors.gold + '33' }]}>
                  <MaterialCommunityIcons name="eye-outline" size={14} color={colors.gold} />
                  <Text style={[styles.previewText, { color: colors.gold }]}>
                    Preview: Rs. 500 = {Math.ceil(500 / parseFloat(newPrice)).toLocaleString()} tokens  ·  Rs. 1,000 = {Math.ceil(1000 / parseFloat(newPrice)).toLocaleString()} tokens
                  </Text>
                </View>
              )}

              {error ? (
                <View style={[styles.errorRow, { backgroundColor: colors.destructive + '18' }]}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.destructive} />
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.gold, opacity: saving ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={16} color={colors.primaryForeground} />
                    <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Save New Price</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Create post */}
            <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.editTitle, { color: colors.foreground }]}>Create Reward Hub Post</Text>
              <Text style={[styles.editSub, { color: colors.mutedForeground }]}>
                Posts appear in the Feed tab. Images are stored on Cloudinary.
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Post content</Text>
              <TextInput
                style={[styles.postInput, { color: colors.foreground, backgroundColor: colors.muted, borderColor: colors.border }]}
                placeholder="Write an announcement..."
                placeholderTextColor={colors.mutedForeground}
                value={postText}
                onChangeText={setPostText}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[styles.imagePickerBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                onPress={pickPostImage}
                activeOpacity={0.8}
              >
                {postImage ? (
                  <Image source={{ uri: postImage.uri }} style={styles.imagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePickerEmpty}>
                    <MaterialCommunityIcons name="image-plus" size={22} color={colors.mutedForeground} />
                    <Text style={[styles.imagePickerText, { color: colors.mutedForeground }]}>
                      Attach a screenshot (optional)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {postImage && (
                <TouchableOpacity onPress={() => setPostImage(null)} style={styles.removeImageRow}>
                  <Ionicons name="close-circle-outline" size={15} color={colors.destructive} />
                  <Text style={[styles.removeImageText, { color: colors.destructive }]}>Remove image</Text>
                </TouchableOpacity>
              )}

              {postError ? (
                <View style={[styles.errorRow, { backgroundColor: colors.destructive + '18' }]}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.destructive} />
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{postError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.accent, opacity: postingPost ? 0.7 : 1 }]}
                onPress={handleCreatePost}
                disabled={postingPost}
                activeOpacity={0.85}
              >
                {postingPost ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={16} color="#fff" />
                    <Text style={styles.btnText}>Publish Post</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 4 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  adminBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14 },

  /* Auth card */
  authCard: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 12, alignItems: 'center' },
  iconWrap: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  authTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  authSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 18 },

  /* Stats */
  statsCard: { borderRadius: 18, borderWidth: 1.5, padding: 16, gap: 6 },
  statsLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.2 },
  statsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  statsValue: { fontSize: 40, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
  statsUnit: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  statsUpdated: { fontSize: 11, fontFamily: 'Inter_400Regular' },

  /* Tiers */
  tiersCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  tiersTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tiersSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1,
  },
  tierVoucher: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  tierTokens: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  /* Edit */
  editCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  editTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  editSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  inputRow: { flexDirection: 'row', gap: 8 },
  inputPrefix: {
    height: 46, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center',
  },
  inputPrefixText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  priceInput: {
    flex: 1, height: 46, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, fontSize: 18, fontFamily: 'Inter_600SemiBold',
  },
  previewBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    borderRadius: 10, borderWidth: 1, padding: 10,
  },
  previewText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', lineHeight: 17 },

  /* Create post */
  postInput: {
    minHeight: 90, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
  imagePickerBtn: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', overflow: 'hidden' },
  imagePickerEmpty: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 24 },
  imagePickerText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  imagePreview: { width: '100%', height: 150 },
  removeImageRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  removeImageText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  /* Shared */
  input: {
    width: '100%', height: 46, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, fontSize: 14, fontFamily: 'Inter_500Medium',
  },
  errorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 50, borderRadius: 14,
  },
  btnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
