import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";
import { ConversationChatScreen, getInitials } from "@/components/messaging/ConversationChatScreen";
import { useMessagingConversations } from "@/hooks/useMessagingConversations";
import { API_BASE_URL } from "@/lib/fetch";
import { parseCard } from "@/lib/messageCards";
import { COLORS, RADIUS, SHADOW } from "@/constants/theme";
import { Search, PenSquare, ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ConversationRow = {
  conversationId: string;
  jobTitle: string | null;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  otherUser: {
    clerkId: string;
    displayName: string;
  } | null;
};


const TEAM_QH_ITEM = {
  conversationId: "__team_qh__",
  jobTitle: "Welcome to Quickhands",
  lastMessageText: "Welcome to Quickhands Pro! Apply to jobs to get started.",
  lastMessageAt: new Date().toISOString(),
  otherUser: {
    clerkId: "__team_qh__",
    displayName: "Team Quickhands",
  },
} as ConversationRow;

const formatTime = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7)
    return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const ConvoRow = ({
  item,
  onPress,
  isPinned = false,
}: {
  item: ConversationRow;
  onPress: () => void;
  isPinned?: boolean;
}) => {
  const initials = getInitials(item.otherUser?.displayName);

  return (
    <Pressable style={styles.row} onPress={onPress} android_ripple={null}>
      <View style={[styles.avatar, isPinned && styles.avatarPinned]}>
        <Text style={[styles.avatarText, isPinned && styles.avatarTextPinned]}>
          {initials}
        </Text>
        {isPinned && <View style={styles.verifiedDot} />}
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>
            {item.otherUser?.displayName || "Coordination board"}
          </Text>
          <Text style={styles.rowTime}>{formatTime(item.lastMessageAt)}</Text>
        </View>
        <Text style={styles.rowPreview} numberOfLines={1}>
          {parseCard(item.lastMessageText || "")?.label || item.lastMessageText || item.jobTitle || "No messages yet"}
        </Text>
      </View>
    </Pressable>
  );
};

const FilterPill = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    style={[styles.pill, active && styles.pillActive]}
    onPress={onPress}
    android_ripple={null}
  >
    <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>
      {label}
    </Text>
  </Pressable>
);

export default function ChatUsersScreen() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    conversationId?: string;
    otherClerkId?: string;
    otherDisplayName?: string;
    jobTitle?: string;
  }>();

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active">("all");

  const conversationId = params.conversationId;
  const otherDisplayName = params.otherDisplayName;
  const jobTitle = params.jobTitle;

  const { conversations, loading, error, refresh } = useMessagingConversations({
    apiUrl: API_BASE_URL,
    getToken,
    enabled: isLoaded && !!isSignedIn && !!userId,
  });

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let list = conversations;

    if (normalizedQuery) {
      list = list.filter((c) => {
        const name = c.otherUser?.displayName?.toLowerCase() || "";
        const title = c.jobTitle?.toLowerCase() || "";
        return name.includes(normalizedQuery) || title.includes(normalizedQuery);
      });
    }

    return list;
  }, [conversations, query]);

  const openConversation = (conversation: ConversationRow) => {
    if (conversation.conversationId === "__team_qh__") return;
    router.push({
      pathname: "/(root)/chat",
      params: {
        conversationId: conversation.conversationId,
        otherClerkId: conversation.otherUser?.clerkId,
        otherDisplayName: conversation.otherUser?.displayName,
        ...(conversation.jobTitle ? { jobTitle: conversation.jobTitle } : {}),
      },
    });
  };

  if (conversationId) {
    if (!isLoaded || !isSignedIn || !userId) {
      return (
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator color={COLORS.navy} />
          <Text style={styles.helper}>Loading your account...</Text>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: 0 }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.detailHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => router.replace("/(root)/chat")}
            style={styles.backBtn}
          >
            <ChevronLeft size={20} color={COLORS.navy} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailTitle} numberOfLines={1}>
              {otherDisplayName || "Coordination Board"}
            </Text>
            {jobTitle ? (
              <Text style={styles.detailSub} numberOfLines={1}>{jobTitle}</Text>
            ) : null}
          </View>
        </View>

        <ConversationChatScreen
          clerkUserId={userId}
          conversationId={conversationId}
          otherDisplayName={otherDisplayName}
          jobTitle={jobTitle}
        />
      </KeyboardAvoidingView>
    );
  }

  const topPad = insets.top + (Platform.OS === "android" ? 12 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Boards</Text>
        <Pressable style={styles.headerIcon} android_ripple={null}>
          <PenSquare size={20} color={COLORS.navyDark} strokeWidth={1.8} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Search size={16} color={COLORS.textMuted} strokeWidth={2} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filters}>
        <FilterPill label="All" active={activeFilter === "all"} onPress={() => setActiveFilter("all")} />
        <FilterPill label="Active" active={activeFilter === "active"} onPress={() => setActiveFilter("active")} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.navy} />
        </View>
      ) : (
        <FlatList
          data={[TEAM_QH_ITEM, ...filteredConversations]}
          keyExtractor={(item) => item.conversationId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ConvoRow
              item={item}
              isPinned={item.conversationId === "__team_qh__"}
              onPress={() => openConversation(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No boards yet</Text>
              <Text style={styles.emptyText}>
                Apply to a job and your coordination board will appear here.
              </Text>
              <TouchableOpacity onPress={() => refresh()} style={styles.refreshBtn}>
                <Text style={styles.refreshLabel}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    gap: 8,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },


  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },

  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
  },
  pillActive: {
    backgroundColor: COLORS.textPrimary,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  pillLabelActive: {
    color: "#FFFFFF",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.background,
    marginLeft: 72,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.navySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPinned: {
    backgroundColor: COLORS.navyDark,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.navy,
  },
  avatarTextPinned: {
    color: "#FFFFFF",
  },
  verifiedDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  rowBody: {
    flex: 1,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  rowTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  rowPreview: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    ...SHADOW.card,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  detailSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  helper: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: COLORS.error,
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 13,
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  refreshBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.textPrimary,
    ...SHADOW.card,
  },
  refreshLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
});
