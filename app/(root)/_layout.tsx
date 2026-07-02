"use client"

import { useEffect, useState } from "react"
import { Tabs, router } from "expo-router"
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Home, MessageCircle, User, Zap } from "lucide-react-native"
import { useNotifications } from "@/contexts/NotificationsContext"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"

const { width: SCREEN_W } = Dimensions.get("window")

/* ─── Layout constants ─── */
const ICON_AREA_H = 52   // visible icon row height
const PILL_W = 52
const PILL_H = 44
const NUM_TABS = 4
const TAB_W = SCREEN_W / NUM_TABS

/* ─── Design tokens ─── */
const C = {
  bg:       "#EEF2F3",
  active:   "#1F3A4A",
  pill:     "#EBEBED",
  inactive: "#A8B4BD",
  surface:  "#FFFFFF",
  border:   "#E5E7EB",
  badge:    "#E35D5B",
}

/* ─── Two-ring loading spinner ─── */
const TwoRingSpinner = ({ size = 40 }: { size?: number }) => {
  const r1 = useSharedValue(0)
  const r2 = useSharedValue(0)

  useEffect(() => {
    r1.value = withRepeat(withTiming(360, { duration: 1100, easing: Easing.linear }), -1)
    r2.value = withRepeat(withTiming(-360, { duration: 1700, easing: Easing.linear }), -1)
  }, [])

  const s1 = useAnimatedStyle(() => ({ transform: [{ rotate: `${r1.value}deg` }] }))
  const s2 = useAnimatedStyle(() => ({ transform: [{ rotate: `${r2.value}deg` }] }))
  const inner = size * 0.58

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{
        position: "absolute", width: size, height: size,
        borderRadius: size / 2, borderWidth: 2,
        borderColor: `${C.active}18`, borderTopColor: C.active,
      }, s1]} />
      <Animated.View style={[{
        position: "absolute", width: inner, height: inner,
        borderRadius: inner / 2, borderWidth: 1.5,
        borderColor: `${C.active}18`, borderBottomColor: C.active,
      }, s2]} />
    </View>
  )
}

/* ─── Icons registry ─── */
type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
const ICONS: Record<string, LucideIcon> = {
  home: Home,
  chat: MessageCircle,
  profile: User,
  train: Zap,
}

/* ─── Single tab button ─── */
function TabItem({
  route,
  isFocused,
  onPress,
  badgeCount = 0,
}: {
  route: { name: string; key: string }
  isFocused: boolean
  onPress: () => void
  badgeCount?: number
}) {
  const Icon = ICONS[route.name] ?? Home
  const scale = useSharedValue(isFocused ? 1.08 : 1)

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.08 : 1, { damping: 14, stiffness: 260 })
  }, [isFocused])

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable style={styles.tabItem} onPress={onPress} android_ripple={null}>
      <Animated.View style={anim}>
        <Icon
          size={22}
          color={isFocused ? C.active : C.inactive}
          strokeWidth={isFocused ? 2.3 : 1.8}
        />
      </Animated.View>

      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? "99+" : String(badgeCount)}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

/* ─── Liquid tab bar (Whop-inspired flat style) ─── */
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { unreadCount } = useNotifications()

  const pillX = useSharedValue(
    state.index * TAB_W + (TAB_W - PILL_W) / 2
  )

  useEffect(() => {
    pillX.value = withSpring(
      state.index * TAB_W + (TAB_W - PILL_W) / 2,
      { damping: 22, stiffness: 300, mass: 0.8 }
    )
  }, [state.index])

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }))

  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}
      pointerEvents="box-none"
    >
      {/* Sliding pill */}
      <Animated.View style={[styles.pill, pillStyle]} />

      {/* Tab icons */}
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => (
          <TabItem
            key={route.key}
            route={route}
            isFocused={state.index === index}
            onPress={() => {
              if (state.index !== index) navigation.navigate(route.name)
            }}
            badgeCount={route.name === "chat" ? unreadCount : 0}
          />
        ))}
      </View>
    </View>
  )
}

/* ─── Root layout ─── */
export default function Layout() {
  const { isLoaded, isSignedIn } = useUser()
  const [navReady, setNavReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setNavReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!isLoaded || !navReady) return
    if (!isSignedIn) router.replace("/")
  }, [isLoaded, navReady, isSignedIn])

  if (!isLoaded) {
    return (
      <View style={styles.loadingWrap}>
        <TwoRingSpinner size={42} />
        <Text style={styles.loadingLabel}>Loading workspace</Text>
      </View>
    )
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="train" />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
    gap: 14,
  },
  loadingLabel: {
    color: C.inactive,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  /* Full-width flat bar — Whop style */
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
  },
  tabRow: {
    flexDirection: "row",
    height: ICON_AREA_H,
    alignItems: "center",
  },
  tabItem: {
    flex: 1,
    height: ICON_AREA_H,
    alignItems: "center",
    justifyContent: "center",
  },
  /* Liquid pill indicator */
  pill: {
    position: "absolute",
    top: (ICON_AREA_H - PILL_H) / 2,
    left: 0,
    width: PILL_W,
    height: PILL_H,
    borderRadius: 22,
    backgroundColor: C.pill,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: "18%",
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: C.badge,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.surface,
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 10,
  },
})
