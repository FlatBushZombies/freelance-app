import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { getApiUrl } from "@/lib/fetch";

const FREELANCER_TAGS = [
  { kind: "available-now", label: "Available now" },
  { kind: "need-address", label: "Need address" },
  { kind: "need-photos", label: "Need photos" },
  { kind: "running-late", label: "Running late" },
  { kind: "job-complete", label: "Job complete" },
];

type Props = {
  clerkUserId: string;
  conversationId: string;
  otherDisplayName?: string;
  jobTitle?: string;
};

type MessageItem = {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  createdAt: string;
};

type ParsedCard = {
  kind: string;
  label: string;
  note: string | null;
};

function parseCard(text: string): ParsedCard | null {
  const normalized = String(text || "").trim();
  if (!normalized.startsWith("QH_CARD::")) {
    return null;
  }

  try {
    const parsed = JSON.parse(normalized.slice("QH_CARD::".length));
    if (!parsed?.label) {
      return null;
    }

    return {
      kind: String(parsed.kind || "update"),
      label: String(parsed.label),
      note: parsed.note ? String(parsed.note) : null,
    };
  } catch {
    return null;
  }
}

function getNextAction(card: ParsedCard | null, isMine: boolean, otherDisplayName?: string) {
  const otherName = otherDisplayName || "the client";

  if (!card) {
    return "Use a status card below to tell the client exactly what you need next.";
  }

  if (isMine) {
    return `Waiting for ${otherName} to act on "${card.label}".`;
  }

  switch (card.kind) {
    case "ready-for-visit":
      return "Head out when ready or confirm the arrival time.";
    case "please-call":
      return "Call the client directly when you can.";
    case "share-location":
      return "Use the shared location and confirm once you are on the way.";
    case "need-quote-update":
      return "Send a fresh quote or explain the updated price.";
    case "confirm-arrival":
      return "Let the client know when you are leaving or arriving.";
    default:
      return `${otherName} shared a new status. Reply with the card that moves the work forward.`;
  }
}

export function ConversationChatScreen({
  clerkUserId,
  conversationId,
  otherDisplayName,
  jobTitle,
}: Props) {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");
  const [selectedTag, setSelectedTag] = useState(FREELANCER_TAGS[0].kind);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const token = await getToken();
      if (!token) {
        setError("Sign in to view coordination updates.");
        return;
      }

      const response = await fetch(
        getApiUrl(`/api/messaging/conversations/${conversationId}/messages`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load updates");
      }

      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load updates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(true).catch(() => undefined);
    const timer = setInterval(() => {
      loadMessages(false).catch(() => undefined);
    }, 8000);

    return () => clearInterval(timer);
  }, [conversationId]);

  const activeTag = useMemo(
    () => FREELANCER_TAGS.find((tag) => tag.kind === selectedTag) || FREELANCER_TAGS[0],
    [selectedTag]
  );

  const latestMessage = messages[messages.length - 1];
  const latestCard = latestMessage ? parseCard(latestMessage.text) : null;
  const nextAction = getNextAction(
    latestCard,
    latestMessage?.senderId === clerkUserId,
    otherDisplayName
  );

  const sendCard = async () => {
    if (sending) {
      return;
    }

    try {
      setSending(true);
      const token = await getToken();
      if (!token) {
        throw new Error("Sign in to send updates");
      }

      const response = await fetch(
        getApiUrl(`/api/messaging/conversations/${conversationId}/messages`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tag: activeTag.kind,
            label: activeTag.label,
            note,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send update");
      }

      setMessages((current) => [...current, data.message]);
      setNote("");
      setError(null);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send update");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{otherDisplayName || "Coordination board"}</Text>
      {jobTitle ? <Text style={styles.subtitle}>{jobTitle}</Text> : null}

      <View style={styles.nextActionCard}>
        <Text style={styles.nextActionLabel}>Next action</Text>
        <Text style={styles.nextActionText}>{nextAction}</Text>
        {latestCard ? (
          <Text style={styles.nextActionMeta}>
            Latest update: {latestCard.label}
          </Text>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.timeline}
        renderItem={({ item }) => {
          const card = parseCard(item.text);
          const isMine = item.senderId === clerkUserId;

          return (
            <View style={[styles.messageCard, isMine ? styles.mine : styles.other]}>
              <Text style={styles.meta}>
                {isMine ? "You" : otherDisplayName || item.senderName || "Other user"} ·{" "}
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.messageLabel}>{card?.label || "Status update"}</Text>
              {card?.note ? <Text style={styles.messageNote}>{card.note}</Text> : null}
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 28 }} />
          ) : (
            <Text style={styles.empty}>
              No updates yet. Send the first status card so the client knows what you need next.
            </Text>
          )
        }
      />

      <View style={styles.tagGrid}>
        {FREELANCER_TAGS.map((tag) => {
          const active = tag.kind === selectedTag;
          return (
            <Pressable
              key={tag.kind}
              onPress={() => setSelectedTag(tag.kind)}
              style={[styles.tagChip, active ? styles.tagChipActive : null]}
            >
              <Text style={[styles.tagChipText, active ? styles.tagChipTextActive : null]}>
                {tag.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.composer}>
        <Text style={styles.composerLabel}>Optional context</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={`Add a short note for "${activeTag.label}"`}
          placeholderTextColor="#94A3B8"
          multiline
          style={styles.input}
        />
        <Pressable onPress={sendCard} style={styles.sendButton} disabled={sending}>
          {sending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>Share status</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    marginBottom: 12,
  },
  nextActionCard: {
    backgroundColor: "#ECFEFF",
    borderWidth: 1,
    borderColor: "#A5F3FC",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  nextActionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    color: "#0F766E",
    marginBottom: 6,
  },
  nextActionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#0F172A",
    fontWeight: "600",
  },
  nextActionMeta: {
    marginTop: 8,
    fontSize: 12,
    color: "#475569",
  },
  error: {
    color: "#DC2626",
    marginBottom: 10,
  },
  timeline: {
    paddingBottom: 12,
  },
  messageCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  mine: {
    backgroundColor: "#E0F2FE",
    borderColor: "#BAE6FD",
  },
  other: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  meta: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 6,
  },
  messageLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  messageNote: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
  },
  empty: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 28,
    lineHeight: 20,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipActive: {
    backgroundColor: "#CFFAFE",
  },
  tagChipText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 12,
  },
  tagChipTextActive: {
    color: "#0F766E",
  },
  composer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 14,
  },
  composerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0F172A",
    textAlignVertical: "top",
    marginBottom: 10,
  },
  sendButton: {
    backgroundColor: "#0F766E",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
