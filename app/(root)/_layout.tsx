"use client"

import { Tabs, router } from "expo-router"
import {
  Image,
  type ImageSourcePropType,
  View,
  ActivityIndicator,
  Platform,
  Text,
} from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { useEffect, useState } from "react"
import { ArrowUpOnSquareStackIcon } from "react-native-heroicons/outline"

import { icons } from "@/constants"

/* -----------------------------------------
   Tab Icon Component (Image OR Heroicon)
------------------------------------------ */
const TabIcon = ({
  source,
  Icon,
  focused,
}: {
  source?: ImageSourcePropType
  Icon?: React.ComponentType<{
    size?: number
    color?: string
    strokeWidth?: number
  }>
  focused: boolean
}) => (
  <View className="flex items-center justify-center" style={{ paddingTop: 6 }}>
    {/* Active indicator */}
    <View
      style={{
        width: 28,
        height: 3,
        backgroundColor: focused ? "#000000" : "transparent",
        borderRadius: 2,
        marginBottom: 6,
      }}
    />

    {Icon ? (
      <Icon
        size={24}
        color={focused ? "#000000" : "#9ca3af"}
        strokeWidth={2}
      />
    ) : (
      <Image
        source={source}
        tintColor={focused ? "#000000" : "#9ca3af"}
        resizeMode="contain"
        className="w-6 h-6"
      />
    )}
  </View>
)

export default function Layout() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [isNavigationReady, setIsNavigationReady] = useState(false)

  // Wait for navigation to be ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLoaded || !isNavigationReady) return

    if (!isSignedIn) {
      router.replace("/")
      return
    }

    const createdAt = user?.createdAt ? new Date(user.createdAt) : null
    const isNewUser =
      createdAt !== null && Date.now() - createdAt.getTime() < 60 * 1000

    if (isNewUser) {
      router.replace("/(auth)/onboarding")
    }
  }, [isLoaded, isSignedIn, user, isNavigationReady])

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="text-gray-500 text-sm mt-4 font-semibold">
          Loading...
        </Text>
      </View>
    )
  }

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: Platform.OS === "ios" ? 24 : 12,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 88 : 76,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.home} focused={focused} />
          ),
        }}
      />

      
      <Tabs.Screen
        name="chat"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.chat} focused={focused} />
          ),
        }}
      />

      {/* Profile — no header */}
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.profile} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="train"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              Icon={ArrowUpOnSquareStackIcon}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  )
}
