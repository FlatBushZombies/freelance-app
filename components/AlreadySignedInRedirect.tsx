import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";

/**
 * Drop into any (auth) screen meant only for signed-out users (sign in,
 * sign up). If the user is already authenticated, shows a brief
 * "already signed in" state and redirects to "/" (which itself resolves
 * onboarding-complete vs. not) instead of the screen's normal form —
 * so a signed-in user never has to go through auth again.
 */
export function AlreadySignedInRedirect() {
  useEffect(() => {
    router.replace("/");
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#2D4A6A" />
      <Text className="font-quicksand-medium text-gray-400 text-sm mt-4 tracking-[0.5px]">
        You&apos;re already signed in — redirecting...
      </Text>
    </View>
  );
}
