import { useSignIn, useAuth } from "@clerk/clerk-expo"
import { Link, router } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { Alert, ScrollView, Text, View } from "react-native"

import CustomButton from "@/components/CustomButton"
import InputField from "@/components/InputField"
import OAuth from "@/components/OAuth"
import { icons } from "@/constants"

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn()
  const { isSignedIn } = useAuth()

  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    // Always go through index route so onboarding check runs consistently.
    if (isSignedIn) router.replace("/")
  }, [isLoaded, isSignedIn])

  const onSignInPress = useCallback(async () => {
    if (!isLoaded || loading) return

    if (!form.email.trim() || !form.password) {
      return Alert.alert("Missing Fields", "Please enter both email and password.")
    }

    setLoading(true)

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email.trim(),
        password: form.password,
      })

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace("/")
      } else {
        console.log("SignIn attempt incomplete:", JSON.stringify(signInAttempt, null, 2))
        Alert.alert("Error", "Log in failed. Please try again.")
      }
    } catch (err: any) {
      console.log("SignIn error:", JSON.stringify(err, null, 2))
      const message = err.errors?.[0]?.longMessage || err.message || "Unexpected error occurred."
      Alert.alert("Error", message)
    } finally {
      setLoading(false)
    }
  }, [isLoaded, loading, form, signIn, setActive])

  if (!isLoaded) return null
  if (isSignedIn) return null

  return (
    <ScrollView
      className="flex-1 bg-white"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 bg-white">

        {/* ── Header Section ── */}
        <View className="w-full h-[280px] bg-gray-50 justify-end pb-8 px-7 rounded-b-[32px]">

          {/* Accent bar */}
          <View className="absolute top-0 left-0 right-0 h-[3px] bg-[#2D3F50] rounded-b-sm" />

          {/* Welcome label */}
          <View className="flex-row items-center mb-3">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2.5" />
            <Text className="font-quicksand-semibold text-[#2D3F50] text-[13px] tracking-[2px] uppercase">
              Register
            </Text>
          </View>

          {/* Main heading */}
          <Text className="font-quicksand-bold text-[32px] text-gray-900 tracking-[-0.5px] leading-[38px]">
            Sign in to{"\n"}your account
          </Text>

          {/* Subtitle */}
          <Text className="font-quicksand-medium text-[15px] text-gray-400 mt-2 leading-[22px]">
            Register as Specialist
          </Text>
        </View>

        {/* ── Form Section ── */}
        <View className="px-6 pt-8 pb-6">


          {/* Divider */}
          <View className="flex-row items-center mt-7 mb-1">
            <View className="flex-1 h-px bg-gray-100" />
            <Text className="font-quicksand-medium px-4 text-[13px] text-gray-300 tracking-[0.5px] uppercase">
              
            </Text>
            <View className="flex-1 h-px bg-gray-100" />
          </View>

          <OAuth />


        </View>
      </View>
    </ScrollView>
  )
}

export default SignIn