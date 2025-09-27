"use client"

import { useEffect } from "react"
import { Text, View, TouchableOpacity, Image, ActivityIndicator } from "react-native"
import { IMAGES } from "@/constants"
import { router } from "expo-router"
import { useAuth } from "@clerk/clerk-expo"

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Redirect if user is already signed in
      router.replace("/(root)/home")
    }
  }, [isLoaded, isSignedIn])

  const handleSignIn = () => {
    router.replace("/(auth)/signin")
  }

  // Show loader while Clerk is checking session
  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white justify-between px-8 py-16">
      {/* Content Container */}
      <View className="flex-1 justify-center items-center">
        {/* Title */}
        <Text className="text-5xl font-quicksand-bold text-gray-900 mb-12 text-center leading-tight px-4">
          Make money with your skills
        </Text>

        {/* Illustration */}
        <View className="items-center justify-center mb-16 w-full">
          <View className="bg-gray-50 rounded-3xl p-8 shadow-sm">
            <Image source={IMAGES.illustration} className="w-80 h-52 rounded-2xl" resizeMode="contain" />
          </View>
        </View>
      </View>

      {/* Buttons Container */}
      <View className="w-full items-center space-y-6">
        <TouchableOpacity
          className="bg-gray-900 rounded-2xl py-5 px-8 w-full items-center shadow-lg active:bg-gray-800"
          onPress={handleSignIn}
          activeOpacity={0.9}
        >
          <Text className="text-white font-quicksand-semibold text-lg">I want to offer services</Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-4 px-8" activeOpacity={0.7}>
          <Text className="text-gray-700 font-quicksand-medium text-base border-b border-gray-300 pb-1">
            I want to look for services
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
