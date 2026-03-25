import { View, Text, ScrollView, TouchableOpacity, Platform } from "react-native";
import { router } from "expo-router";

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  forest:   "#2D4A6A",
  fern:     "#52839B",
  mint:     "#D8E8ED",
  leaf:     "#74A0B9",
  sage:     "#B8C9D4",
  ink:      "#1A1C1F",
  charcoal: "#2C3036",
  stone:    "#6B7479",
  pebble:   "#A8B2B5",
  mist:     "#F2F5F7",
  cloud:    "#FFFFFF",
  fog:      "#EBEff2",
}

const shadow = {
  card: Platform.select({
    ios: { shadowColor: "#2D4A6A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 24 },
    android: { elevation: 3 },
  }),
  btn: Platform.select({
    ios: { shadowColor: "#2D4A6A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 18 },
    android: { elevation: 8 },
  }),
  sm: Platform.select({
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
    android: { elevation: 1 },
  }),
}
// ──────────────────────────────────────────────────────────────

const CARDS = [
  {
    title: "How the Platform Works",
    description: "Understand bookings, payments, and ratings.",
    emoji: "🗺️",
    accent: C.forest,
    bg: C.mint,
  },
  {
    title: "Getting More Jobs",
    description: "Tips to improve your profile and get selected.",
    emoji: "🚀",
    accent: C.fern,
    bg: `${C.fern}18`,
  },
  {
    title: "Safety & Trust",
    description: "Learn best practices for safe and professional work.",
    emoji: "🛡️",
    accent: C.charcoal,
    bg: `${C.leaf}20`,
  },
  {
    title: "Payments & Payouts",
    description: "How you get paid and avoid payment issues.",
    emoji: "💸",
    accent: C.charcoal,
    bg: C.fog,
  },
]

export default function Train() {
  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: C.mist }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Filter Tabs (like 4th screen top tabs) ── */}
      <View className="flex-row items-center gap-2 px-5 pt-14 pb-4">
        <View
          className="px-4 py-2 rounded-full flex-row items-center gap-1.5"
          style={{ backgroundColor: C.cloud, borderWidth: 1, borderColor: C.fog }}
        >
          <View className="w-4 h-4 rounded items-center justify-center" style={{ backgroundColor: C.mint }}>
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.fern }} />
          </View>
          <Text className="text-xs font-semibold" style={{ color: C.stone }}>Platform</Text>
        </View>
        <View
          className="px-4 py-2 rounded-full flex-row items-center gap-1.5"
          style={{ backgroundColor: C.forest }}
        >
          <Text className="text-xs font-bold" style={{ color: C.cloud }}>Training</Text>
        </View>
      </View>

      {/* ── Search Bar (like 4th screen) ── */}
      <View className="px-5 mb-5">
        <View
          className="flex-row items-center px-4 py-3 rounded-xl"
          style={{ backgroundColor: C.fog }}
        >
          <Text className="text-sm" style={{ color: C.pebble }}>🔍</Text>
          <Text className="text-sm ml-2 flex-1" style={{ color: C.pebble }}>Search Training Modules</Text>
        </View>
      </View>

      {/* ── Header Card (styled like a news card header) ── */}
      <View className="px-5 mb-4">
        <View
          className="rounded-2xl p-5"
          style={{ backgroundColor: C.cloud, borderWidth: 1, borderColor: C.fog, ...shadow.card }}
        >
          {/* Header row with avatar-like element */}
          <View className="flex-row items-center mb-4">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: C.mint, borderWidth: 1.5, borderColor: `${C.fern}30` }}
            >
              <Text className="text-lg">👋</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold tracking-wider uppercase" style={{ color: C.forest }}>
                Quickhands Platform
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: C.pebble }}>Training Hub</Text>
            </View>
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${C.fern}20` }}>
              <Text className="text-[10px] font-semibold" style={{ color: C.fern }}>New</Text>
            </View>
          </View>

          {/* Title */}
          <Text
            className="text-2xl font-black mb-2"
            style={{ color: C.ink, letterSpacing: -0.8 }}
          >
            Get Trained
          </Text>

          {/* Description */}
          <Text className="text-sm leading-5 mb-4" style={{ color: C.stone }}>
            Learn how to succeed as a specialists and get more jobs faster.
          </Text>

          {/* Tags row (like trending/global news tags) */}
          <View className="flex-row items-center gap-2">
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: `${C.forest}15` }}>
              <Text className="text-[10px] font-semibold" style={{ color: C.forest }}>Essential</Text>
            </View>
            <View className="px-2.5 py-1 rounded-full" style={{ backgroundColor: C.fog }}>
              <Text className="text-[10px] font-semibold" style={{ color: C.stone }}>4 Modules</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Progress bar strip (styled like engagement metrics bar) ── */}
      <View className="px-5 mb-5">
        <View
          className="flex-row items-center justify-between rounded-xl px-4 py-3"
          style={{ backgroundColor: C.cloud, borderWidth: 1, borderColor: C.fog, ...shadow.sm }}
        >
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm">📊</Text>
              <Text className="text-xs font-bold" style={{ color: C.ink }}>Your Progress</Text>
            </View>
            <Text className="text-[11px]" style={{ color: C.pebble }}>0 of 4 modules complete</Text>
          </View>
          <View className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: C.mint }}>
            <Text className="text-sm font-black" style={{ color: C.forest }}>0%</Text>
          </View>
        </View>
      </View>

      {/* ── Training Cards (styled like news feed cards) ── */}
      <View className="px-5 gap-3 mb-6">
        {CARDS.map((card, index) => (
          <TrainingCard
            key={index}
            index={index}
            title={card.title}
            description={card.description}
            emoji={card.emoji}
            accentColor={card.accent}
            bgColor={card.bg}
            onPress={() => router.push("/")}
          />
        ))}
      </View>

      {/* ── CTA (styled like action button) ── */}
      <View className="px-5">
        <TouchableOpacity
          onPress={() => router.replace("/(root)/home")}
          activeOpacity={0.85}
          className="flex-row items-center justify-center py-4 rounded-xl gap-2"
          style={{ backgroundColor: C.forest, ...shadow.btn }}
        >
          <Text className="text-base font-extrabold" style={{ color: C.cloud }}>
            Start Taking Jobs
          </Text>
          <View
            className="w-6 h-6 rounded-lg items-center justify-center"
            style={{ backgroundColor: `${C.fern}40` }}
          >
            <Text className="text-xs font-black" style={{ color: C.cloud }}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Footnote */}
        <Text className="text-center text-xs mt-4" style={{ color: C.pebble }}>
          You can always come back to finish training later.
        </Text>
      </View>
    </ScrollView>
  );
}

function TrainingCard({
  title,
  description,
  emoji,
  accentColor,
  bgColor,
  onPress,
  index,
}: {
  title: string;
  description: string;
  emoji: string;
  accentColor: string;
  bgColor: string;
  onPress: () => void;
  index: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.93}
      className="rounded-2xl p-4"
      style={{ backgroundColor: C.cloud, borderWidth: 1, borderColor: C.fog, ...shadow.card }}
    >
      {/* Top row - Avatar-like icon + Title area (like news card header) */}
      <View className="flex-row items-start gap-3">
        {/* Icon block (like avatar) */}
        <View
          className="w-11 h-11 rounded-full items-center justify-center"
          style={{ backgroundColor: bgColor, borderWidth: 1, borderColor: `${accentColor}20` }}
        >
          <Text className="text-lg">{emoji}</Text>
        </View>

        {/* Text content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-bold" style={{ color: C.ink }}>
              {title}
            </Text>
            <Text className="text-lg" style={{ color: C.pebble }}>›</Text>
          </View>
          <Text className="text-xs leading-4" style={{ color: C.stone }}>
            {description}
          </Text>
        </View>
      </View>

      {/* Bottom metrics row (like engagement metrics) */}
      <View className="flex-row items-center mt-3 pt-3 gap-4" style={{ borderTopWidth: 1, borderTopColor: C.fog }}>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs" style={{ color: C.pebble }}>📖</Text>
          <Text className="text-[11px]" style={{ color: C.pebble }}>Module {index + 1}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-xs" style={{ color: C.pebble }}>⏱</Text>
          <Text className="text-[11px]" style={{ color: C.pebble }}>5 min</Text>
        </View>
        <View className="flex-1" />
        <View className="px-2 py-1 rounded-md" style={{ backgroundColor: C.fog }}>
          <Text className="text-[10px] font-semibold" style={{ color: C.stone }}>Start</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
