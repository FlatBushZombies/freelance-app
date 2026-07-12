import { Stack, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import Toast from "react-native-toast-message";

import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";

import "./globals.css";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { toastConfig } from "@/components/Toast";
import {
  configurePushNotifications,
  registerDevicePushToken,
  registerNotificationTapHandler,
} from "@/lib/pushNotifications";
// Side-effect import: registers the background location TaskManager task.
// Must happen at the app's entry point so it re-registers on every JS
// engine cold-start, including ones the OS triggers to run the task itself
// while the app isn't open — importing this only from the profile screen
// wouldn't guarantee that.
import "@/lib/backgroundLocation";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

function PushNotificationRegistration() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [registeredForUserId, setRegisteredForUserId] = useState<string | null>(null);

  useEffect(() => {
    configurePushNotifications();
    return registerNotificationTapHandler();
  }, []);

  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      setRegisteredForUserId(null);
      return;
    }

    if (registeredForUserId === user.id) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await registerDevicePushToken(getToken);
        if (!cancelled) {
          setRegisteredForUserId(user.id);
        }
      } catch (error) {
        console.warn("[Push] Freelance app registration failed", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn, registeredForUserId, user?.id]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "Quicksand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
    "Quicksand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
    "Quicksand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
    "Quicksand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
    "Quicksand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <NotificationsProvider>
        <PushNotificationRegistration />
        <Stack screenOptions={{ headerShown: false }} />
        <Toast config={toastConfig} />
      </NotificationsProvider>
    </ClerkProvider>
  );
}
