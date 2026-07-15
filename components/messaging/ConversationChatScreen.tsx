import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "@/lib/fetch";
import { parseCard } from "@/lib/messageCards";
import { useMessagingSocket, type ServerMessage } from "@/hooks/useMessagingSocket";
import { COLORS, RADIUS, SHADOW } from "@/constants/theme";

const FREELANCER_TAGS = [
  { kind: "available-now", label: "Available now", icon: "checkmark-circle-outline" as const },
  { kind: "need-address", label: "Need address", icon: "location-outline" as const },
  { kind: "need-photos", label: "Need photos", icon: "camera-outline" as const },
  { kind: "running-late", label: "Running late", icon: "time-outline" as const },
  { kind: "job-complete", label: "Job complete", icon: "checkmark-done-outline" as const },
];

type Props = {
  clerkUserId: string;
  conversationId: string;
  otherDisplayName?: string;
  jobTitle?: string;
};

export function getInitials(name?: string) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function cardKind(message: ServerMessage) {
  return parseCard(message.text)?.kind ?? null;
}

// Consecutive messages from the same sender are visually grouped (like a
// normal chat app) — a system card always breaks the group on both sides.
function breaksGroup(a: ServerMessage, b: ServerMessage) {
  return (
    a.senderId !== b.senderId ||
    cardKind(a) === "application-submitted" ||
    cardKind(b) === "application-submitted"
  );
}

function kindIcon(kind: string): keyof typeof Ionicons.glyphMap {
  const tag = FREELANCER_TAGS.find((t) => t.kind === kind);
  return tag?.icon ?? "flag-outline";
}

export function ConversationChatScreen({
  clerkUserId,
  conversationId,
  otherDisplayName,
  jobTitle,
}: Props) {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingTag, setSendingTag] = useState<string | null>(null);

  const { messages, sendMessage, loadingHistory, lastError } = useMessagingSocket({
    serverUrl: API_BASE_URL,
    apiBaseUrl: API_BASE_URL,
    getToken,
    conversationId,
    enabled: true,
  });

  const sendChatMessage = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await sendMessage({ label: trimmed });
      setMessageText("");
    } finally {
      setSending(false);
    }
  };

  const sendQuickTag = async (tag: { kind: string; label: string }) => {
    if (sendingTag) return;
    setSendingTag(tag.kind);
    try {
      await sendMessage({ tag: tag.kind, label: tag.label });
    } finally {
      setSendingTag(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{otherDisplayName || "Chat"}</Text>
        {jobTitle ? <Text style={styles.subtitle}>{jobTitle}</Text> : null}
      </View>

      {lastError ? <Text style={styles.error}>{lastError}</Text> : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.timeline}
        renderItem={({ item, index }) => {
          const card = parseCard(item.text);
          const isMine = item.senderId === clerkUserId;

          if (card?.kind === "application-submitted") {
            return (
              <View style={styles.systemPill}>
                <Ionicons name="briefcase-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.systemPillText}>
                  {isMine ? "You applied for this job" : `${item.senderName || "A freelancer"} applied for this job`}
                  {" · "}
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            );
          }

          const startsGroup = index === 0 || breaksGroup(messages[index - 1], item);
          const endsGroup =
            index === messages.length - 1 || breaksGroup(item, messages[index + 1]);
          const isPlainMessage = !card || card.kind === "message";

          return (
            <View style={{ marginTop: startsGroup ? 14 : 3 }}>
              {!isMine && startsGroup ? (
                <Text style={styles.senderName}>{otherDisplayName || item.senderName || "Other user"}</Text>
              ) : null}

              <View
                style={[
                  styles.messageRow,
                  isMine ? styles.messageRowMine : styles.messageRowOther,
                ]}
              >
                {!isMine ? (
                  <View style={styles.avatarSlot}>
                    {endsGroup ? (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {getInitials(otherDisplayName || item.senderName)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View
                  style={[
                    styles.bubble,
                    isMine ? styles.bubbleMine : styles.bubbleOther,
                    isPlainMessage ? null : styles.bubbleTag,
                  ]}
                >
                  {isPlainMessage ? (
                    <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : null]}>
                      {card?.label ?? item.text}
                    </Text>
                  ) : (
                    <View>
                      <View style={styles.tagRow}>
                        <Ionicons
                          name={kindIcon(card!.kind)}
                          size={14}
                          color={isMine ? "#FFFFFF" : COLORS.navy}
                        />
                        <Text
                          style={[styles.tagLabel, isMine ? styles.bubbleTextMine : null]}
                        >
                          {card!.label}
                        </Text>
                      </View>
                      {card?.note ? (
                        <Text
                          style={[styles.tagNote, isMine ? styles.bubbleTextMine : null]}
                        >
                          {card.note}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>

              {endsGroup ? (
                <Text style={[styles.timestamp, isMine ? styles.timestampMine : styles.timestampOther]}>
                  {formatTime(item.createdAt)}
                </Text>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          loadingHistory ? (
            <ActivityIndicator style={{ marginTop: 28 }} />
          ) : (
            <Text style={styles.empty}>
              No messages yet. Say hello or send a quick update below.
            </Text>
          )
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickReplies}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        {FREELANCER_TAGS.map((tag) => (
          <Pressable
            key={tag.kind}
            onPress={() => sendQuickTag(tag)}
            disabled={sendingTag === tag.kind}
            style={styles.tagChip}
          >
            {sendingTag === tag.kind ? (
              <ActivityIndicator size="small" color={COLORS.navy} />
            ) : (
              <>
                <Ionicons name={tag.icon} size={14} color={COLORS.navy} />
                <Text style={styles.tagChipText}>{tag.label}</Text>
              </>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Message"
          placeholderTextColor={COLORS.textMuted}
          multiline
          style={styles.input}
        />
        <Pressable
          onPress={sendChatMessage}
          style={[styles.sendButton, !messageText.trim() ? styles.sendButtonDisabled : null]}
          disabled={sending || !messageText.trim()}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 12 },
  header: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  error: { color: COLORS.error, marginBottom: 10 },
  timeline: { paddingBottom: 12, flexGrow: 1 },

  systemPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 10,
  },
  systemPillText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },

  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginLeft: 40,
    marginBottom: 4,
  },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  messageRowMine: { justifyContent: "flex-end" },
  messageRowOther: { justifyContent: "flex-start" },
  avatarSlot: { width: 28, alignItems: "center" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.navySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 10, fontWeight: "700", color: COLORS.navy },

  bubble: { maxWidth: "76%", borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: COLORS.navy },
  bubbleOther: { backgroundColor: COLORS.surfaceMuted },
  bubbleTag: { borderWidth: 1, borderColor: COLORS.borderSoft },
  bubbleText: { fontSize: 15, lineHeight: 21, color: COLORS.textPrimary },
  bubbleTextMine: { color: "#FFFFFF" },

  tagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tagLabel: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  tagNote: { marginTop: 4, fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },

  timestamp: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  timestampMine: { alignSelf: "flex-end", marginRight: 2 },
  timestampOther: { alignSelf: "flex-start", marginLeft: 40 },

  empty: { textAlign: "center", color: COLORS.textSecondary, marginTop: 28, lineHeight: 20 },

  quickReplies: { flexGrow: 0, marginBottom: 8 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipText: { color: COLORS.navy, fontWeight: "600", fontSize: 12 },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 15,
    ...SHADOW.card,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.navy,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.card,
  },
  sendButtonDisabled: { backgroundColor: COLORS.border, shadowOpacity: 0, elevation: 0 },
});
