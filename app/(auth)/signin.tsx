import { useSignIn, useAuth } from "@clerk/clerk-expo"
import { Link, router } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import { ScrollView, Text, View } from "react-native"

import CustomButton from "@/components/CustomButton"
import InputField from "@/components/InputField"
import OAuth from "@/components/OAuth"
import { AlreadySignedInRedirect } from "@/components/AlreadySignedInRedirect"
import { icons } from "@/constants"
import { showErrorToast, showInfoToast } from "@/lib/toast"

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn()
  const { isSignedIn } = useAuth()

  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)

  const onSignInPress = useCallback(async () => {
    if (!isLoaded || loading) return

    if (!form.email.trim() || !form.password) {
      return showInfoToast("Missing Fields", "Please enter both email and password.")
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
        showErrorToast("Error", "Log in failed. Please try again.")
      }
    } catch (err: any) {
      console.log("SignIn error:", JSON.stringify(err, null, 2))
      const message = err.errors?.[0]?.longMessage || err.message || "Unexpected error occurred."
      showErrorToast("Error", message)
    } finally {
      setLoading(false)
    }
  }, [isLoaded, loading, form, signIn, setActive])

  if (!isLoaded) return null
  if (isSignedIn) return <AlreadySignedInRedirect />

  return (
    <ScrollView
      className="flex-1 bg-white"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 bg-white">

        <View className="w-full h-[280px] bg-gray-50 justify-end pb-8 px-7 rounded-b-[32px]">

          <View className="absolute top-0 left-0 right-0 h-[3px] bg-[#2D4A6A] rounded-b-sm" />

          <View className="flex-row items-center mb-3">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2.5" />
            <Text className="font-quicksand-semibold text-[#2D4A6A] text-[13px] tracking-[2px] uppercase">
              Register
            </Text>
          </View>

          
          <Text className="font-quicksand-bold text-[32px] text-gray-900 tracking-[-0.5px] leading-[38px]">
            Create your{"\n"}Quickhands Pro account
          </Text>

          
          <Text className="font-quicksand-medium text-[15px] text-gray-400 mt-2 leading-[22px]">
            Register as Specialist
          </Text>
        </View>

        
        <View className="px-6 pt-8 pb-6">


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