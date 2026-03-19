"use client"

import { Tabs, router } from "expo-router"
import { View, ActivityIndicator, Platform, Text } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { useEffect, useState } from "react"
import { ArrowUpOnSquareStackIcon } from "react-native-heroicons/outline"
import { icons } from "@/constants"
import { Film, User, BookMarked, Home, MessageCircle } from "lucide-react-native"

const TabIcon = ({
  Icon,
  focused,
  label,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
  focused: boolean
  label: string
}) => (
  <View style={{ alignItems: "center", justifyContent: "center", flex: 1, minWidth: 56 }}>
    <Icon
      size={22}
      color={focused ? "#E50914" : "#6B7280"}
      strokeWidth={focused ? 2.5 : 1.8}
    />
    <Text
      style={{
        fontSize: 10,
        fontWeight: focused ? "600" : "400",
        color: focused ? "#E50914" : "#6B7280",
        marginTop: 4,
        letterSpacing: 0.2,
      }}
    >
      {label}
    </Text>
  </View>
)

export default function Layout() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [isNavigationReady, setIsNavigationReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsNavigationReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLoaded || !isNavigationReady) return
    if (!isSignedIn) { router.replace("/"); return }

    const createdAt = user?.createdAt ? new Date(user.createdAt) : null
    const isNewUser = createdAt !== null && Date.now() - createdAt.getTime() < 60 * 1000
    if (isNewUser) router.replace("/(auth)/onboarding")
  }, [isLoaded, isSignedIn, user, isNavigationReady])

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#111", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <ActivityIndicator size="small" color="#E50914" />
        </View>
        <Text style={{ color: "#6B7280", fontSize: 13, fontWeight: "500", letterSpacing: 0.3 }}>
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
          backgroundColor: "#000",
          borderTopColor: "#111",
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 6,
          height: Platform.OS === "ios" ? 82 : 68,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 12,
        },
        tabBarActiveTintColor: "#E50914",
        tabBarInactiveTintColor: "#6B7280",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Home} focused={focused} label="Home" />
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