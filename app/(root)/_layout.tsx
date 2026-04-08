"use client"

import { useEffect, useState } from "react"
import { Tabs, router } from "expo-router"
import { ActivityIndicator, Platform, Text, View } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ArrowUpOnSquareStackIcon } from "react-native-heroicons/outline"
import { Home, MessageCircle, User } from "lucide-react-native"
import { useNotifications } from "@/contexts/NotificationsContext"

const TAB_BAR_HEIGHT = 74
const TAB_SLOT_HEIGHT = 58

const COLOR = {
  active: "#708238",
  activeLight: "rgba(112,130,56,0.18)",
  activeGlow: "#8ea64c",
  inactive: "#6B7280",
  bg: "#000000",
  border: "#111111",
  label: "#d1d5db",
  badge: "#EF4444",
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
        width: 68,
        height: TAB_SLOT_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 4,
      }}
    >
    <View
      style={{
        position: "absolute",
        top: 4,
        width: focused ? 18 : 0,
        height: 3,
        borderRadius: 999,
        backgroundColor: focused ? COLOR.active : "transparent",
        opacity: focused ? 1 : 0,
      }}
    />

    <View
      style={{
        width: 44,
        height: 34,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? COLOR.activeLight : "transparent",
        ...(focused
          ? Platform.select({
              ios: {
                shadowColor: COLOR.activeGlow,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 12,
              },
              android: {
                elevation: 4,
              },
            })
          : {}),
      }}
    >
      <Icon
        size={21}
        color={focused ? COLOR.active : COLOR.inactive}
        strokeWidth={focused ? 2.35 : 1.85}
      />
      {badgeCount > 0 ? (
        <View
          style={{
            position: "absolute",
            top: 2,
            right: 0,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            backgroundColor: COLOR.badge,
            borderWidth: 1,
            borderColor: COLOR.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 9,
              lineHeight: 11,
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
        marginTop: 4,
        fontSize: 10,
        lineHeight: 13,
        fontWeight: focused ? "700" : "500",
        color: focused ? COLOR.label : COLOR.inactive,
        letterSpacing: 0.22,
      }}
    >
      {label}
    </Text>
    </View>
  )
}

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
          backgroundColor: COLOR.bg,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: "#111",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <ActivityIndicator size="small" color={COLOR.active} />
        </View>
        <Text
          style={{
            color: COLOR.inactive,
            fontSize: 13,
            fontWeight: "500",
            letterSpacing: 0.3,
          }}
        >
          Loading...
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
          backgroundColor: COLOR.bg,
          borderTopColor: COLOR.border,
          borderTopWidth: 1,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 10),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.28,
          shadowRadius: 16,
          elevation: 10,
        },
        tabBarItemStyle: {
          height: TAB_BAR_HEIGHT,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Home} focused={focused} label="Home" badgeCount={unreadCount} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={MessageCircle} focused={focused} label="Chat" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={User} focused={focused} label="Profile" />
          ),
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
