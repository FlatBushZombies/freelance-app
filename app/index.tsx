"use client"

import { useEffect, useState } from "react"
import { Text, View, TouchableOpacity, ActivityIndicator, Image } from "react-native"
import { router } from "expo-router"
import { useSession } from "@clerk/clerk-expo"
import { Feather } from "@expo/vector-icons"
import { IMAGES } from "@/constants"
import { SplashScreen } from "@/components/SplashScreen"

export default function Index() {
  const { session, isLoaded } = useSession()
  const isSignedIn = session?.status === "active"
  const userId = session?.user?.id
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded || !isSignedIn || !userId) return

      try {
        const response = await fetch(
          `https://quickhands-api.vercel.app/api/user/get?clerkId=${userId}`
        )
        const data = await response.json()

        if (data.user?.completedOnboarding) {
          router.replace("/(root)/home")
        } else {
          router.replace("/(auth)/onboarding")
        }
      } catch (error) {
        console.error("Error checking onboarding:", error)
        router.replace("/(auth)/onboarding")
      }
    }

    checkOnboarding()
  }, [isLoaded, isSignedIn, userId])

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.replace("/(root)/home")
    } else {
      router.replace("/(auth)/signin")
    }
  }

  const handleBrowseServices = () => {
    if (isSignedIn) {
      router.replace("/(root)/home")
    } else {
      router.replace("/(auth)/signin")
    }
  }

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />
  }

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#6B8FAF" />
      </View>
    )
  }

  if (isSignedIn) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#6B8FAF" />
        <Text className="font-quicksand-medium text-gray-400 text-sm mt-4 tracking-[0.5px]">
          Redirecting...
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">

      {/* Subtle top accent */}
      <View className="h-[3px] bg-[#6B8FAF] rounded-b-sm" />

      {/* Content */}
      <View className="flex-1 px-8 pt-[60px] pb-10">

        {/* Center Section */}
        <View className="flex-1 justify-center items-center">

          {/* Logo Container */}
          <View className="items-center mb-10">
            <View
              style={{
                borderRadius: 28,
                shadowColor: "#6B8FAF",
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.2,
                shadowRadius: 32,
                elevation: 20,
              }}
            >
              <Image
                source={IMAGES.logo}
                style={{ width: 100, height: 100, borderRadius: 28 }}
                resizeMode="contain"
              />
            </View>

            {/* Brand Name */}
            <Text className="font-quicksand-semibold text-[#6B8FAF] text-sm mt-5 tracking-[4px] uppercase">
              QuickHands
            </Text>
          </View>

          {/* Decorative divider */}
          <View className="w-10 h-0.5 bg-[#6B8FAF] rounded-sm mb-8" />

          {/* Title */}
          <Text className="font-quicksand-bold text-[36px] text-gray-900 text-center leading-[44px] px-2 tracking-[-0.5px]">
            Make money with your skills
          </Text>

          {/* Subtitle */}
          <Text className="font-quicksand-medium text-base text-gray-400 text-center mt-4 px-6 leading-6">
            Connect with people who need your expertise
          </Text>
        </View>

        {/* Bottom CTA Section */}
        <View className="w-full items-center">

          {/* Primary Button */}
          <TouchableOpacity
            onPress={handleGetStarted}
            activeOpacity={0.85}
            className="w-full bg-gray-900 rounded-2xl"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <View className="w-full py-[18px] px-8 rounded-2xl border border-white/10 flex-row items-center justify-center">
              <Text className="font-quicksand-semibold text-white text-[17px] tracking-[0.3px]">
                {isSignedIn ? "Go to Dashboard" : "I want to offer services"}
              </Text>
              <Feather
                name="arrow-right"
                size={18}
                color="rgba(255,255,255,0.5)"
                style={{ marginLeft: 12 }}
              />
            </View>
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity
            onPress={handleBrowseServices}
            activeOpacity={0.6}
            className="py-[18px] px-8 mt-3"
          >
            <View className="items-center flex-row gap-2">
              <Text className="font-quicksand-medium text-gray-500 text-[15px]">
                {isSignedIn ? "Continue to home" : "I want to look for services"}
              </Text>
              <Feather name="arrow-right" size={15} color="#6B7280" />
            </View>
            <View className="w-full h-px bg-gray-200 mt-1.5 rounded-sm" />
          </TouchableOpacity>

          {/* Trust Indicator */}
          <View className="flex-row items-center mt-7 bg-gray-50 px-4 py-2 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-[#6B8FAF] mr-2" />
            <Text className="font-quicksand-medium text-gray-400 text-xs tracking-[0.5px]">
              Early access for specialists
            </Text>
          </View>

        </View>
      </View>
    </View>
  )
}