import { useSignIn, useAuth } from "@clerk/clerk-expo";
import { Link, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAuth from "@/components/OAuth";
import { icons } from "@/constants";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.replace("/(root)/home");
    }
  }, [isSignedIn]);

  const onSignInPress = useCallback(async () => {
    if (!isLoaded || loading) return;

    if (!form.email.trim() || !form.password) {
      return Alert.alert("Missing Fields", "Please enter both email and password.");
    }

    setLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email.trim(),
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(root)/home");
      } else {
        console.log("SignIn attempt incomplete:", JSON.stringify(signInAttempt, null, 2));
        Alert.alert("Error", "Log in failed. Please try again.");
      }
    } catch (err: any) {
      console.log("SignIn error:", JSON.stringify(err, null, 2));
      const message =
        err.errors?.[0]?.longMessage || err.message || "Unexpected error occurred.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, form, loading]);

  if (!isLoaded) return null; // Avoid flicker while Clerk state loads

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[250px]">
          <Text className="text-2xl text-black font-JakartaSemiBold absolute bottom-5 left-5">
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
            onChangeText={(value) => setForm({ ...form, email: value })}
          />

          <InputField
            label="Password"
            placeholder="Enter password"
            icon={icons.lock}
            secureTextEntry
            textContentType="password"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
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
  );
};

export default SignIn;
