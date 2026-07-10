import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { FEED_POSTS, Post } from '@/constants/mockData';
import PostCard from '@/components/PostCard';

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface ApiPost {
  id: number;
  adminName: string;
  contentText: string;
  screenshotUrl: string | null;
  createdAt: string;
}

function mapApiPost(p: ApiPost): Post {
  return {
    post_id: `api-${p.id}`,
    admin_name: p.adminName,
    content_text: p.contentText,
    screenshot_url: p.screenshotUrl ?? '',
    likes_count: 0,
    shares_count: 0,
    comments: [],
    createdAt: p.createdAt,
  };
}

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>(FEED_POSTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/posts`);
      if (!res.ok) return;
      const data = await res.json() as { posts: ApiPost[] };
      // Merge admin-created posts (from the API) above the built-in showcase posts.
      setPosts([...data.posts.map(mapApiPost), ...FEED_POSTS]);
    } catch {
      // Keep showing the built-in posts if the server is unreachable.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

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
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>Reward Hub</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>Latest payouts &amp; updates</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: colors.success + '22', borderColor: colors.success + '55' }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.liveText, { color: colors.success }]}>Live</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.gold} size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.post_id}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No posts yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5 },
  liveText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  listContent: { padding: 14 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});
