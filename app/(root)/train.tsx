import { View, Text, ScrollView, TouchableOpacity } from "react-native"
import { router } from "expo-router"
import {
  MapIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  ChartBarIcon,
  BookOpenIcon,
  ClockIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  SparklesIcon,
  Squares2X2Icon,
} from "react-native-heroicons/outline"
import { CheckBadgeIcon } from "react-native-heroicons/solid"

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

const CARDS = [
  {
    title:       "How the Platform Works",
    description: "Understand bookings, payments, and ratings.",
    Icon:        MapIcon,
    accent:      C.forest,
    bg:          C.mint,
  },
  {
    title:       "Getting More Jobs",
    description: "Tips to improve your profile and get selected.",
    Icon:        RocketLaunchIcon,
    accent:      C.fern,
    bg:          `${C.fern}18`,
  },
  {
    title:       "Safety & Trust",
    description: "Learn best practices for safe and professional work.",
    Icon:        ShieldCheckIcon,
    accent:      C.charcoal,
    bg:          `${C.leaf}20`,
  },
  {
    title:       "Payments & Payouts",
    description: "How you get paid and avoid payment issues.",
    Icon:        BanknotesIcon,
    accent:      C.charcoal,
    bg:          C.fog,
  },
]

export default function Train() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Filter Tabs ── */}
      <View className="flex-row items-center gap-2 px-5 pt-14 pb-4">
        <View
          className="px-4 py-2 rounded-full flex-row items-center gap-1.5"
          style={{ borderWidth: 0.5, borderColor: C.fog, backgroundColor: C.cloud }}
        >
          <Squares2X2Icon size={13} color={C.fern} />
          <Text className="text-xs font-medium" style={{ color: C.stone }}>Platform</Text>
        </View>

        <View
          className="px-4 py-2 rounded-full flex-row items-center gap-1.5"
          style={{ backgroundColor: C.forest }}
        >
          <AcademicCapIcon size={13} color={C.cloud} />
          <Text className="text-xs font-medium" style={{ color: C.cloud }}>Training</Text>
        </View>
      </View>

      {/* ── Search Bar ── */}
      <View className="px-5 mb-5">
        <View
          className="flex-row items-center px-4 py-3 rounded-xl gap-2"
          style={{ backgroundColor: C.fog }}
        >
          <MagnifyingGlassIcon size={16} color={C.pebble} />
          <Text className="text-sm flex-1" style={{ color: C.pebble }}>
            Search Training Modules
          </Text>
        </View>
      </View>

      {/* ── Header Card ── */}
      <View className="px-5 mb-4">
        <View
          className="rounded-2xl p-5 bg-white"
          style={{ borderWidth: 0.5, borderColor: C.fog }}
        >
          {/* Header row */}
          <View className="flex-row items-center mb-4">
            <View
              className="w-11 h-11 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: C.mint, borderWidth: 0.5, borderColor: `${C.fern}30` }}
            >
              <AcademicCapIcon size={20} color={C.forest} />
            </View>
            <View className="flex-1">
              <Text
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: C.forest }}
              >
                Quickhands Platform
              </Text>
              <Text className="text-[11px] mt-0.5" style={{ color: C.pebble }}>
                Training Hub
              </Text>
            </View>
            <View
              className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
              style={{ backgroundColor: `${C.fern}18` }}
            >
              <SparklesIcon size={10} color={C.fern} />
              <Text className="text-[10px] font-medium" style={{ color: C.fern }}>New</Text>
            </View>
          </View>

          {/* Title */}
          <Text
            className="text-2xl font-bold mb-1.5"
            style={{ color: C.ink, letterSpacing: -0.5 }}
          >
            Get Trained
          </Text>

          {/* Description */}
          <Text className="text-sm leading-5 mb-4" style={{ color: C.stone }}>
            Learn how to succeed as a specialists and get more jobs faster.
          </Text>

          {/* Tags row */}
          <View className="flex-row items-center gap-2">
            <View
              className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
              style={{ backgroundColor: `${C.forest}12` }}
            >
              <CheckBadgeIcon size={11} color={C.forest} />
              <Text className="text-[10px] font-medium" style={{ color: C.forest }}>Essential</Text>
            </View>
            <View
              className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
              style={{ backgroundColor: C.fog }}
            >
              <Squares2X2Icon size={11} color={C.stone} />
              <Text className="text-[10px] font-medium" style={{ color: C.stone }}>4 Modules</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Progress strip ── */}
      <View className="px-5 mb-5">
        <View
          className="flex-row items-center justify-between rounded-xl px-4 py-3 bg-white"
          style={{ borderWidth: 0.5, borderColor: C.fog }}
        >
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <ChartBarIcon size={15} color={C.forest} />
              <Text className="text-xs font-medium" style={{ color: C.ink }}>Your Progress</Text>
            </View>
            <Text className="text-[11px]" style={{ color: C.pebble }}>
              0 of 4 modules complete
            </Text>
          </View>
          <View className="px-3 py-1 rounded-lg" style={{ backgroundColor: C.mint }}>
            <Text className="text-xs font-semibold" style={{ color: C.forest }}>0%</Text>
          </View>
        </View>
      </View>

      {/* ── Training Cards ── */}
      <View className="px-5 gap-3 mb-6">
        {CARDS.map((card, index) => (
          <TrainingCard
            key={index}
            index={index}
            title={card.title}
            description={card.description}
            Icon={card.Icon}
            accentColor={card.accent}
            bgColor={card.bg}
            onPress={() => router.push("/")}
          />
        ))}
      </View>

      {/* ── CTA ── */}
      <View className="px-5">
        <TouchableOpacity
          onPress={() => router.replace("/(root)/home")}
          activeOpacity={0.85}
          className="flex-row items-center justify-center py-4 rounded-xl gap-2"
          style={{ backgroundColor: C.forest }}
        >
          <Text className="text-sm font-semibold" style={{ color: C.cloud }}>
            Start Taking Jobs
          </Text>
          <View
            className="w-6 h-6 rounded-lg items-center justify-center"
            style={{ backgroundColor: `${C.fern}40` }}
          >
            <ArrowRightIcon size={13} color={C.cloud} />
          </View>
        </TouchableOpacity>

        <Text className="text-center text-xs mt-4" style={{ color: C.pebble }}>
          You can always come back to finish training later.
        </Text>
      </View>
    </ScrollView>
  )
}

function TrainingCard({
  title,
  description,
  Icon,
  accentColor,
  bgColor,
  onPress,
  index,
}: {
  title: string
  description: string
  Icon: React.ComponentType<{ size: number; color: string }>
  accentColor: string
  bgColor: string
  onPress: () => void
  index: number
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.93}
      className="rounded-2xl p-4 bg-white"
      style={{ borderWidth: 0.5, borderColor: C.fog }}
    >
      {/* Top row — icon tile + title */}
      <View className="flex-row items-start gap-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: bgColor, borderWidth: 0.5, borderColor: `${accentColor}20` }}
        >
          <Icon size={18} color={accentColor} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-medium flex-1 mr-2" style={{ color: C.ink }}>
              {title}
            </Text>
            <ChevronRightIcon size={16} color={C.pebble} />
          </View>
          <Text className="text-xs leading-[18px]" style={{ color: C.stone }}>
            {description}
          </Text>
        </View>
      </View>

      {/* Footer metrics row */}
      <View
        className="flex-row items-center mt-3 pt-3 gap-4"
        style={{ borderTopWidth: 0.5, borderTopColor: C.fog }}
      >
        <View className="flex-row items-center gap-1">
          <BookOpenIcon size={12} color={C.pebble} />
          <Text className="text-[11px]" style={{ color: C.pebble }}>Module {index + 1}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <ClockIcon size={12} color={C.pebble} />
          <Text className="text-[11px]" style={{ color: C.pebble }}>5 min</Text>
        </View>
        <View className="flex-1" />
        <View
          className="px-2.5 py-1 rounded-md flex-row items-center gap-1"
          style={{
            backgroundColor: `${accentColor}12`,
            borderWidth: 0.5,
            borderColor: `${accentColor}25`,
          }}
        >
          <Text className="text-[10px] font-medium" style={{ color: accentColor }}>Start</Text>
          <ArrowRightIcon size={9} color={accentColor} />
        </View>
      </View>
    </TouchableOpacity>
  )
}