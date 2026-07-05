import React, { useState } from 'react';
import {
  Alert,
  Image,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { Post, BANNED_WORDS } from '@/constants/mockData';

interface PostCardProps {
  post: Post;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function PostCard({ post }: PostCardProps) {
  const colors = useColors();
  const { requireAuth } = useApp();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);
  const [commentError, setCommentError] = useState('');

  const doLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (liked) {
      setLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const handleLike = () => {
    requireAuth(doLike);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${post.content_text}\n\nJoin QuizBox – Play & Win!` });
    } catch (_) {}
  };

  const doComment = () => {
    const text = commentText.trim();
    if (!text) return;
    const lowerText = text.toLowerCase();
    const hasBannedWord = BANNED_WORDS.some(word => lowerText.includes(word));
    if (hasBannedWord) {
      setCommentError('Comment contains restricted words.');
      setCommentText('');
      setTimeout(() => setCommentError(''), 3000);
      return;
    }
    setCommentError('');
    setComments(prev => [
      ...prev,
      { username: 'You', comment_text: text, timestamp: new Date().toISOString() },
    ]);
    setCommentText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComment = () => {
    requireAuth(doComment);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.accent + '33' }]}>
          <MaterialCommunityIcons name="shield-crown" size={16} color={colors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.adminName, { color: colors.foreground }]}>{post.admin_name}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
        <View style={[styles.officialBadge, { backgroundColor: colors.gold + '22', borderColor: colors.gold + '55' }]}>
          <Text style={[styles.officialText, { color: colors.gold }]}>Official</Text>
        </View>
      </View>

      <Text style={[styles.contentText, { color: colors.foreground }]}>{post.content_text}</Text>

      <Image
        source={{ uri: post.screenshot_url }}
        style={[styles.screenshot, { backgroundColor: colors.muted }]}
        resizeMode="cover"
      />

      {/* Actions */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Feather name="heart" size={18} color={liked ? colors.destructive : colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: liked ? colors.destructive : colors.mutedForeground }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(prev => !prev)} activeOpacity={0.7}>
          <Feather name="message-circle" size={18} color={colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.7}>
          <Feather name="share-2" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={[styles.commentsSection, { borderTopColor: colors.border }]}>
          {comments.map((c, i) => (
            <View key={i} style={styles.commentRow}>
              <Text style={[styles.commentUser, { color: colors.accent }]}>{c.username}</Text>
              <Text style={[styles.commentText, { color: colors.foreground }]}>{c.comment_text}</Text>
            </View>
          ))}
          {comments.length === 0 && (
            <Text style={[styles.noComments, { color: colors.mutedForeground }]}>No comments yet.</Text>
          )}
          {commentError !== '' && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{commentError}</Text>
          )}
          <View style={[styles.commentInputRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.foreground }]}
              placeholder="Write a comment..."
              placeholderTextColor={colors.mutedForeground}
              value={commentText}
              onChangeText={t => { setCommentText(t); setCommentError(''); }}
              returnKeyType="send"
              onSubmitEditing={handleComment}
            />
            <TouchableOpacity onPress={handleComment} style={styles.sendBtn}>
              <Feather name="send" size={16} color={commentText.trim() ? colors.gold : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', gap: 12, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  adminName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  time: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  officialBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  officialText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  contentText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  screenshot: { width: '100%', height: 180, borderRadius: 10 },
  actionBar: { flexDirection: 'row', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  commentsSection: { borderTopWidth: 1, paddingTop: 12, gap: 10 },
  commentRow: { gap: 2 },
  commentUser: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  commentText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  noComments: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  errorText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 40 },
  commentInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', height: '100%' },
  sendBtn: { padding: 4 },
});
