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
  label,
}: {
  source?: ImageSourcePropType
  Icon?: React.ComponentType<{
    size?: number
    color?: string
    strokeWidth?: number
  }>
  focused: boolean
  label: string
}) => (
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 4,
      minWidth: 56,
    }}
  >
    {Icon ? (
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: focused ? "#111827" : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          size={20}
          color={focused ? "#FFFFFF" : "#9CA3AF"}
          strokeWidth={focused ? 2.5 : 1.8}
        />
      </View>
    ) : (
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          backgroundColor: focused ? "#111827" : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={source}
          tintColor={focused ? "#FFFFFF" : "#9CA3AF"}
          resizeMode="contain"
          style={{ width: 20, height: 20 }}
        />
      </View>
    )}
    <Text
      style={{
        fontSize: 10,
        fontWeight: focused ? "600" : "400",
        color: focused ? "#111827" : "#9CA3AF",
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FAFAFA",
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
        <Text
          style={{
            color: "#6B7280",
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
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          paddingTop: 6,
          height: Platform.OS === "ios" ? 82 : 68,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 16,
          elevation: 12,
        },
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.home} focused={focused} label="Home" />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.chat} focused={focused} label="Chat" />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.profile} focused={focused} label="Profile" />
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
              label="Train"
            />
          ),
        }}
      />
    </Tabs>
  )
}
