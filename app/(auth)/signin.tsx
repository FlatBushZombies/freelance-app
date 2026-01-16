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

  const [form, setForm] = useState({
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)

  // ✅ Redirect immediately if session already exists
  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn) {
      router.replace("/(root)/home")
    }
  }, [isLoaded, isSignedIn])

  const onSignInPress = useCallback(async () => {
    if (!isLoaded || loading) return

    if (!form.email.trim() || !form.password) {
      return Alert.alert(
        "Missing Fields",
        "Please enter both email and password."
      )
    }

    setLoading(true)

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email.trim(),
        password: form.password,
      })

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace("/(root)/home")
      } else {
        console.log(
          "SignIn attempt incomplete:",
          JSON.stringify(signInAttempt, null, 2)
        )
        Alert.alert("Error", "Log in failed. Please try again.")
      }
    } catch (err: any) {
      console.log("SignIn error:", JSON.stringify(err, null, 2))
      const message =
        err.errors?.[0]?.longMessage ||
        err.message ||
        "Unexpected error occurred."
      Alert.alert("Error", message)
    } finally {
      setLoading(false)
    }
  }, [isLoaded, loading, form, signIn, setActive])

  // ✅ Avoid UI flicker while Clerk initializes
  if (!isLoaded) return null

  // ✅ Prevent rendering while redirecting
  if (isSignedIn) return null

  return (
    <ScrollView
      className="flex-1 bg-white"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]" style={{ backgroundColor: "#F9FAFB" }}>
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5" style={{ textShadowColor: "rgba(0, 0, 0, 0.02)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
            Welcome 👋
          </Text>
        </View>

        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Enter email"
            icon={icons.email}
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(value) =>
              setForm({ ...form, email: value })
            }
          />

          <InputField
            label="Password"
            placeholder="Enter password"
            icon={icons.lock}
            secureTextEntry
            textContentType="password"
            value={form.password}
            onChangeText={(value) =>
              setForm({ ...form, password: value })
            }
          />

          <CustomButton
            title={loading ? "Signing In..." : "Sign In"}
            onPress={onSignInPress}
            className="mt-6"
            disabled={loading}
          />

          <OAuth />

          <Link
            href="/(auth)/signup"
            className="text-lg text-center text-general-200 mt-10"
          >
            Don’t have an account?{" "}
            <Text className="text-primary-500">Sign Up</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  )
}

export default SignIn
