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
    if (isSignedIn) router.replace("/(root)/home")
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

          {/* Input Fields Container */}
          <View
            className="bg-white rounded-[20px] border border-gray-100 p-5"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.03,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <InputField
              label="Email"
              placeholder="Enter email"
              icon={icons.email}
              textContentType="emailAddress"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(value: string) => setForm({ ...form, email: value })}
            />

            <View className="h-2" />

            <InputField
              label="Password"
              placeholder="Enter password"
              icon={icons.lock}
              secureTextEntry
              textContentType="password"
              value={form.password}
              onChangeText={(value: string) => setForm({ ...form, password: value })}
            />
          </View>

          {/* Sign In Button */}
          <View className="mt-6">
            <CustomButton
              title={loading ? "Signing In..." : "Sign In"}
              onPress={onSignInPress}
              className="mt-0"
              disabled={loading}
            />
          </View>

          {/* Divider */}
          <View className="flex-row items-center mt-7 mb-1">
            <View className="flex-1 h-px bg-gray-100" />
            <Text className="font-quicksand-medium px-4 text-[13px] text-gray-300 tracking-[0.5px] uppercase">
              or
            </Text>
            <View className="flex-1 h-px bg-gray-100" />
          </View>

          <OAuth />

          {/* Sign Up Link */}
          <View className="items-center mt-8 pb-4">
            <Link
              href="/(auth)/signup"
              className="font-quicksand-medium text-[15px] text-center text-gray-400"
            >
              Don't have an account?{" "}
              <Text className="font-quicksand-semibold text-[#2D3F50]">
                Sign Up
              </Text>
            </Link>
          </View>

        </View>
      </View>
    </ScrollView>
  )
}

export default SignIn