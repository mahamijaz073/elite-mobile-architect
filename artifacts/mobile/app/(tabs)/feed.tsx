import React from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { FEED_POSTS } from '@/constants/mockData';
import PostCard from '@/components/PostCard';

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Reward Hub</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Latest payouts &amp; updates</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: colors.success + '22', borderColor: colors.success + '55' }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.liveText, { color: colors.success }]}>Live</Text>
        </View>
      </View>

      <FlatList
        data={FEED_POSTS}
        keyExtractor={item => item.post_id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No posts yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5 },
  liveText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  listContent: { padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
