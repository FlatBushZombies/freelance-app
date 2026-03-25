import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { ConversationChatScreen } from '@/components/messaging/ConversationChatScreen';
import { router, useLocalSearchParams } from 'expo-router';

// .env may include `/api` suffix; normalize so we don't end up with `/api/api/...`
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '')
  .replace(/\/$/, '')
  .replace(/\/api\/?$/, '');

export default function ChatUsersScreen() {
  const { getToken, userId } = useAuth();
  const params = useLocalSearchParams<{
    conversationId?: string;
    otherClerkId?: string;
    otherDisplayName?: string;
  }>();

  const conversationId = params.conversationId;
  const otherDisplayName = params.otherDisplayName;

  const [q, setQ] = useState('');
  const [users, setUsers] = useState<
    { clerkId: string; displayName: string; email: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const token = await getToken();
      if (!token) {
        setErr('Not signed in');
        return;
      }
      const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      const res = await fetch(`${API_BASE_URL}/api/messaging/users${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setUsers(data.users || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [getToken, q]);

  React.useEffect(() => {
    // Only load the list when not currently inside a conversation.
    if (conversationId) return;
    load();
  }, [load, conversationId]);

  const startChat = async (otherClerkId: string, displayName: string) => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(
      `${API_BASE_URL}/api/messaging/conversation-with/${encodeURIComponent(otherClerkId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (!res.ok) {
      setErr(data.message || 'Could not open chat');
      return;
    }

    // Navigate to a "conversation view" inside the same tab
    router.push({
      pathname: '/(root)/chat',
      params: {
        conversationId: data.conversationId,
        otherClerkId,
        otherDisplayName: data.otherUser?.displayName ?? displayName,
      },
    });
  };

  if (!API_BASE_URL) {
    return (
      <View style={styles.centered}>
        <Text>Set EXPO_PUBLIC_API_URL</Text>
      </View>
    );
  }

  if (conversationId) {
    if (!userId) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.empty}>Loading your account...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.replace('/(root)/chat')} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Messages</Text>
        </View>
        <ConversationChatScreen
          clerkUserId={userId}
          conversationId={conversationId}
          otherDisplayName={otherDisplayName}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <TextInput
        style={styles.search}
        placeholder="Search users"
        value={q}
        onChangeText={setQ}
        onSubmitEditing={load}
      />
      {err ? <Text style={styles.err}>{err}</Text> : null}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.clerkId}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => startChat(item.clerkId, item.displayName)}
            >
              <Text style={styles.name}>{item.displayName}</Text>
              <Text style={styles.sub}>{item.email}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No users yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  backButtonText: { color: '#fff', fontWeight: '600' },
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13, color: '#666' },
  err: { color: 'crimson', marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 24, color: '#888' },
});