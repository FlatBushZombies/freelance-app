"use client"

import { useEffect, useState } from "react"
import { Tabs, router } from "expo-router"
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ArrowUpOnSquareStackIcon } from "react-native-heroicons/outline"
import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { Home, MessageCircle, User } from "lucide-react-native"
import { useNotifications } from "@/contexts/NotificationsContext"

const TAB_BAR_HEIGHT = 82

const COLOR = {
  background: "#EEF2F3",
  shellBorder: "rgba(255,255,255,0.86)",
  shellShadow: "rgba(25,39,52,0.16)",
  active: "#1F3A4A",
  activeSoft: "rgba(31,58,74,0.11)",
  accent: "#6F8B74",
  inactive: "#80909C",
  label: "#233746",
  badge: "#E35D5B",
}

const TabIcon = ({
  Icon,
  focused,
  label,
  badgeCount = 0,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  focused: boolean
  label: string
  badgeCount?: number
}) => {
  const badgeLabel = badgeCount > 99 ? "99+" : badgeCount.toString()

  return (
    <View
      style={{
        width: 74,
        height: 58,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          minWidth: 58,
          height: 36,
          paddingHorizontal: focused ? 14 : 0,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: focused ? COLOR.activeSoft : "transparent",
        }}
      >
        <Icon
          size={21}
          color={focused ? COLOR.active : COLOR.inactive}
          strokeWidth={focused ? 2.4 : 2}
        />

        {badgeCount > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: focused ? 4 : 14,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 4,
              borderRadius: 9,
              backgroundColor: COLOR.badge,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: "#F7FAFA",
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 9,
                lineHeight: 10,
                fontWeight: "700",
              }}
            >
              {badgeLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={{
          marginTop: 6,
          fontSize: 10,
          lineHeight: 12,
          letterSpacing: 0.34,
          textTransform: "uppercase",
          fontWeight: focused ? "700" : "600",
          color: focused ? COLOR.label : COLOR.inactive,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

const TabBarShell = () => (
  <View style={styles.shell}>
    <BlurView
      tint={Platform.OS === "ios" ? "light" : "default"}
      intensity={45}
      style={StyleSheet.absoluteFill}
    />
    <LinearGradient
      colors={["rgba(255,255,255,0.96)", "rgba(239,245,243,0.92)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  </View>
)

export default function Layout() {
  const { isLoaded, isSignedIn } = useUser()
  const { unreadCount } = useNotifications()
  const [isNavigationReady, setIsNavigationReady] = useState(false)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const timer = setTimeout(() => setIsNavigationReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLoaded || !isNavigationReady) return
    if (!isSignedIn) {
      router.replace("/")
    }
  }, [isLoaded, isNavigationReady, isSignedIn])

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLOR.background,
        }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 20,
            backgroundColor: "rgba(255,255,255,0.88)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            shadowColor: "#1C3140",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.08,
            shadowRadius: 18,
            elevation: 5,
          }}
        >
          <ActivityIndicator size="small" color={COLOR.active} />
        </View>
        <Text
          style={{
            color: COLOR.inactive,
            fontSize: 13,
            fontWeight: "600",
            letterSpacing: 0.3,
          }}
        >
          Loading workspace
        </Text>
      </View>
    )
  }

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, 10),
          height: TAB_BAR_HEIGHT,
          paddingTop: 10,
          paddingBottom: 8,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: COLOR.shellShadow,
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 1,
          shadowRadius: 28,
        },
        tabBarBackground: () => <TabBarShell />,
        tabBarItemStyle: {
          height: TAB_BAR_HEIGHT - 6,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} label="Home" />,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={MessageCircle} focused={focused} label="Board" badgeCount={unreadCount} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} label="Profile" />,
        }}
      />

      <Tabs.Screen
        name="train"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={ArrowUpOnSquareStackIcon} focused={focused} label="Train" />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLOR.shellBorder,
  },
})
