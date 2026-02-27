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
      style={{ flex: 1, backgroundColor: C.mist }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 68, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={{ marginBottom: 36 }}>
        {/* Eyebrow */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          marginBottom: 12,
        }}>
          <View style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            backgroundColor: C.mint,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: `${C.fern}30`,
          }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.fern }} />
          </View>
          <Text style={{
            fontSize: 12,
            fontWeight: "700",
            color: C.forest,
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}>
            Quickhands Platform
          </Text>
        </View>

        <Text style={{
          fontSize: 34,
          fontWeight: "900",
          color: C.ink,
          letterSpacing: -1.6,
          lineHeight: 40,
          marginBottom: 10,
        }}>
          Get Trained 👋
        </Text>
        <Text style={{
          color: C.stone,
          fontSize: 15,
          lineHeight: 23,
          fontWeight: "400",
          maxWidth: 290,
        }}>
          Learn how to succeed as a specialists and get more jobs faster.
        </Text>
      </View>

      {/* ── Progress bar strip ── */}
      <View style={{
        backgroundColor: C.cloud,
        borderRadius: 16,
        padding: 18,
        marginBottom: 28,
        borderWidth: 1.5,
        borderColor: C.fog,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        ...shadow.sm,
      }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.ink, letterSpacing: -0.2 }}>
            Your Progress
          </Text>
          <Text style={{ fontSize: 11, color: C.pebble, fontWeight: "500", marginTop: 2 }}>
            0 of 4 modules complete
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: C.forest, letterSpacing: -0.8 }}>
            0%
          </Text>
        </View>
      </View>

      {/* ── Training Cards ── */}
      <View style={{ gap: 12, marginBottom: 36 }}>
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

      {/* ── CTA ── */}
      <View>
        <TouchableOpacity
          onPress={() => router.replace("/(root)/home")}
          activeOpacity={0.85}
          style={{
            backgroundColor: C.forest,
            paddingVertical: 18,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            ...shadow.btn,
          }}
        >
          <Text style={{
            color: C.cloud,
            fontSize: 16,
            fontWeight: "800",
            letterSpacing: 0.2,
          }}>
            Start Taking Jobs
          </Text>
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            backgroundColor: `${C.fern}40`,
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Text style={{ color: C.cloud, fontSize: 13, fontWeight: "900" }}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Footnote */}
        <Text style={{
          textAlign: "center",
          color: C.pebble,
          fontSize: 12,
          fontWeight: "500",
          marginTop: 16,
          letterSpacing: 0.1,
        }}>
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
      style={{
        backgroundColor: C.cloud,
        borderRadius: 22,
        padding: 20,
        borderWidth: 1.5,
        borderColor: C.fog,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        ...shadow.card,
      }}
    >
      {/* Icon block */}
      <View style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: `${accentColor}20`,
        flexShrink: 0,
      }}>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>

      {/* Text */}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15,
          fontWeight: "800",
          color: C.ink,
          letterSpacing: -0.4,
          marginBottom: 4,
        }}>
          {title}
        </Text>
        <Text style={{
          fontSize: 13,
          color: C.stone,
          lineHeight: 19,
          fontWeight: "400",
        }}>
          {description}
        </Text>
      </View>

      {/* Arrow chip */}
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: C.fog,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Text style={{ color: C.stone, fontSize: 14, fontWeight: "700" }}>›</Text>
      </View>
    </TouchableOpacity>
  );
}