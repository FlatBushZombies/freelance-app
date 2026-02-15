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
        // Let index.tsx handle the redirect based on onboarding status
        router.replace("/")
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

  if (!isLoaded) return null
  if (isSignedIn) return null

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* Header Section */}
        <View
          style={{
            width: "100%",
            height: 280,
            backgroundColor: "#FAFAFA",
            justifyContent: "flex-end",
            paddingBottom: 32,
            paddingHorizontal: 28,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          {/* Subtle accent bar at top */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: "#10B981",
              borderBottomLeftRadius: 3,
              borderBottomRightRadius: 3,
            }}
          />

          {/* Small welcome label */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#10B981",
                marginRight: 10,
              }}
            />
            <Text
              style={{
                fontSize: 13,
                color: "#10B981",
                letterSpacing: 2,
                textTransform: "uppercase",
                fontWeight: "600",
              }}
            >
              Welcome back
            </Text>
          </View>

          {/* Main heading */}
          <Text
            style={{
              fontSize: 32,
              color: "#111827",
              fontWeight: "700",
              letterSpacing: -0.5,
              lineHeight: 38,
            }}
          >
            Sign in to{"\n"}your account
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontSize: 15,
              color: "#9CA3AF",
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Pick up where you left off
          </Text>
        </View>

        {/* Form Section */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 24,
          }}
        >
          {/* Input Fields Container */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#F3F4F6",
              padding: 20,
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
              onChangeText={(value: string) =>
                setForm({ ...form, email: value })
              }
            />

            <View style={{ height: 8 }} />

            <InputField
              label="Password"
              placeholder="Enter password"
              icon={icons.lock}
              secureTextEntry
              textContentType="password"
              value={form.password}
              onChangeText={(value: string) =>
                setForm({ ...form, password: value })
              }
            />
          </View>

          {/* Sign In Button */}
          <View style={{ marginTop: 24 }}>
            <CustomButton
              title={loading ? "Signing In..." : "Sign In"}
              onPress={onSignInPress}
              className="mt-0"
              disabled={loading}
            />
          </View>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 28,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "#F3F4F6",
              }}
            />
            <Text
              style={{
                paddingHorizontal: 16,
                fontSize: 13,
                color: "#D1D5DB",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              or
            </Text>
            <View
              style={{
                flex: 1,
                height: 1,
                backgroundColor: "#F3F4F6",
              }}
            />
          </View>

          <OAuth />

          {/* Sign Up Link */}
          <View
            style={{
              alignItems: "center",
              marginTop: 32,
              paddingBottom: 16,
            }}
          >
            <Link
              href="/(auth)/signup"
              style={{
                fontSize: 15,
                textAlign: "center",
                color: "#9CA3AF",
              }}
            >
              Don't have an account?{" "}
              <Text
                style={{
                  color: "#10B981",
                  fontWeight: "600",
                }}
              >
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
