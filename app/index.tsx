"use client"

import { useEffect } from "react"
import { Text, View, TouchableOpacity, ActivityIndicator, Image } from "react-native"
import { router } from "expo-router"
import { useAuth } from "@clerk/clerk-expo"
import { IMAGES } from "@/constants"

export default function Index() {
  const { isLoaded, isSignedIn, userId } = useAuth()

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded || !isSignedIn || !userId) return
      
      try {
        // Check if user has completed onboarding
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
        console.error('Error checking onboarding:', error)
        // Default to onboarding on error
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
    router.replace("/(auth)/signin")
  }

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    )
  }

  if (isSignedIn) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#10B981" />
        <Text
          className="font-quicksand-medium"
          style={{
            color: "#9CA3AF",
            fontSize: 14,
            marginTop: 16,
            letterSpacing: 0.5,
          }}
        >
          Redirecting...
        </Text>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Subtle top accent */}
      <View
        style={{
          height: 3,
          backgroundColor: "#10B981",
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
        }}
      />

      {/* Content */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 32,
          paddingTop: 60,
          paddingBottom: 40,
        }}
      >
        {/* Center Section */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Logo Container */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View
              style={{
                borderRadius: 28,
                shadowColor: "#10B981",
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.2,
                shadowRadius: 32,
                elevation: 20,
              }}
            >
              <Image
                source={IMAGES.logo}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 28,
                }}
                resizeMode="contain"
              />
            </View>

            {/* Brand Name */}
            <Text
              className="font-quicksand-semibold"
              style={{
                color: "#10B981",
                fontSize: 14,
                marginTop: 20,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              QuickHands
            </Text>
          </View>

          {/* Decorative divider */}
          <View
            style={{
              width: 40,
              height: 2,
              backgroundColor: "#10B981",
              borderRadius: 1,
              marginBottom: 32,
            }}
          />

          {/* Title */}
          <Text
            className="font-quicksand-bold"
            style={{
              fontSize: 36,
              color: "#111827",
              textAlign: "center",
              lineHeight: 44,
              paddingHorizontal: 8,
              letterSpacing: -0.5,
            }}
          >
            Make money with your skills
          </Text>

          {/* Subtitle */}
          <Text
            className="font-quicksand-medium"
            style={{
              fontSize: 16,
              color: "#9CA3AF",
              textAlign: "center",
              marginTop: 16,
              paddingHorizontal: 24,
              lineHeight: 24,
            }}
          >
            Connect with people who need your expertise
          </Text>
        </View>

        {/* Bottom CTA Section */}
        <View style={{ width: "100%", alignItems: "center" }}>
          {/* Primary Button */}
          <TouchableOpacity
            onPress={handleGetStarted}
            activeOpacity={0.85}
            style={{
              width: "100%",
              backgroundColor: "#111827",
              borderRadius: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <View
              style={{
                width: "100%",
                paddingVertical: 18,
                paddingHorizontal: 32,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                className="font-quicksand-semibold"
                style={{
                  color: "#FFFFFF",
                  fontSize: 17,
                  letterSpacing: 0.3,
                }}
              >
                {isSignedIn ? "Go to Dashboard" : "I want to offer services"}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 18,
                  marginLeft: 12,
                }}
              >
                {"->"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity
            onPress={handleBrowseServices}
            activeOpacity={0.6}
            style={{
              paddingVertical: 18,
              paddingHorizontal: 32,
              marginTop: 12,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text
                className="font-quicksand-medium"
                style={{
                  color: "#6B7280",
                  fontSize: 15,
                }}
              >
                I want to look for services
              </Text>
              <View
                style={{
                  width: "100%",
                  height: 1,
                  backgroundColor: "#E5E7EB",
                  marginTop: 6,
                  borderRadius: 1,
                }}
              />
            </View>
          </TouchableOpacity>

          {/* Trust Indicator */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 28,
              backgroundColor: "#F9FAFB",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#10B981",
                marginRight: 8,
              }}
            />
            <Text
              className="font-quicksand-medium"
              style={{
                color: "#9CA3AF",
                fontSize: 12,
                letterSpacing: 0.5,
              }}
            >
              Early access for specialists
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
