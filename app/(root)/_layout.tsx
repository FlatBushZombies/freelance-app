"use client"

import { useEffect, useState } from "react"
import { Tabs, router } from "expo-router"
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  UserIcon,
} from "react-native-heroicons/outline"
import {
  AcademicCapIcon as AcademicCapSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  HomeIcon as HomeSolid,
  UserIcon as UserSolid,
} from "react-native-heroicons/solid"
import { useNotifications } from "@/contexts/NotificationsContext"
import { COLORS } from "@/constants/theme"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"

// @callstack/liquid-glass is iOS 26+ only. Import conditionally so
// the app doesn't crash on Android, older iOS, or Expo Go where the
// native module isn't linked.
let LiquidGlassView: any = null
let isLiquidGlassSupported = false
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const lg = require("@callstack/liquid-glass")
  LiquidGlassView = lg.LiquidGlassView
  isLiquidGlassSupported = lg.isLiquidGlassSupported ?? false
} catch {}

const C = {
  bg:       "#EEF2F3",
  active:   COLORS.navyDark,
  inactive: "#A8B4BD",
  surface:  "#FFFFFF",
  badge:    "#E35D5B",
}

const ICON_SIZE = 22

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

type RouteConfig = {
  name: string
  OutlineIcon: React.ElementType
  SolidIcon: React.ElementType
  label: string
  hasBadge?: boolean
}

const ROUTE_CONFIG: RouteConfig[] = [
  { name: "home",    OutlineIcon: HomeIcon,                SolidIcon: HomeSolid,        label: "Home"     },
  { name: "chat",    OutlineIcon: ChatBubbleLeftRightIcon, SolidIcon: ChatSolid,        label: "Chat",    hasBadge: true },
  { name: "profile", OutlineIcon: UserIcon,                SolidIcon: UserSolid,        label: "Profile"  },
  { name: "train",   OutlineIcon: AcademicCapIcon,         SolidIcon: AcademicCapSolid, label: "Training" },
]

function GlassTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { unreadCount } = useNotifications()

  const useGlass = Platform.OS === "ios" && isLiquidGlassSupported && LiquidGlassView !== null

  const tabItems = ROUTE_CONFIG.map((config) => {
    const route = state.routes.find((r) => r.name === config.name)
    if (!route) return null
    const routeIndex = state.routes.indexOf(route)
    const focused = state.index === routeIndex
    const Icon = focused ? config.SolidIcon : config.OutlineIcon
    const badgeCount = config.hasBadge ? unreadCount : 0

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      })
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name)
      }
    }

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.tabItem}
      >
        <View style={styles.iconWrap}>
          <Icon
            size={ICON_SIZE}
            color={focused ? C.active : C.inactive}
            strokeWidth={focused ? 2.1 : 1.8}
          />
          {badgeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badgeCount > 99 ? "99+" : String(badgeCount)}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, focused && styles.labelActive]}>
          {config.label}
        </Text>
      </TouchableOpacity>
    )
  })

  const pillContent = <View style={styles.tabRow}>{tabItems}</View>

  return (
    <View
      style={[
        styles.outerWrap,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
      pointerEvents="box-none"
    >
      {useGlass ? (
        <LiquidGlassView
          style={styles.pill}
          effect="regular"
          interactive
        >
          {pillContent}
        </LiquidGlassView>
      ) : (
        <View style={[styles.pill, styles.pillFallback]}>
          {pillContent}
        </View>
      )}
    </View>
  )
}

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
      tabBar={(props) => <GlassTabBar {...props} />}
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
  outerWrap: {
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  pill: {
    borderRadius: 36,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  pillFallback: {
    backgroundColor: Platform.OS === "ios"
      ? "rgba(252,252,252,0.91)"
      : "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.055)",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    gap: 4,
  },
  iconWrap: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -7,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 3,
    borderRadius: 8.5,
    backgroundColor: C.badge,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.surface,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    lineHeight: 11,
    fontFamily: "Quicksand-Bold",
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.22,
    fontFamily: "Quicksand-Medium",
    color: C.inactive,
  },
  labelActive: {
    fontFamily: "Quicksand-Bold",
    color: C.active,
  },
})
