import { Tabs, router } from "expo-router";
import { Image, ImageSourcePropType, View, ActivityIndicator } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { icons } from "@/constants";

const TabIcon = ({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) => (
  <View
    className={`flex flex-row justify-center items-center rounded-full ${
      focused ? "bg-general-300" : ""
    }`}
  >
    <View
      className={`rounded-full w-12 h-12 items-center justify-center ${
        focused ? "bg-general-400" : ""
      }`}
    >
      <Image
        source={source}
        tintColor="white"
        resizeMode="contain"
        className="w-7 h-7"
      />
    </View>
  </View>
);

export default function Layout() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return; // Wait until Clerk is ready

    if (!isSignedIn) {
      router.replace("/"); // Redirect unauthenticated users to landing
      return;
    }

    // ✅ Safely handle possible null or undefined createdAt
    const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
    const isNewUser =
      createdAt !== null && Date.now() - createdAt.getTime() < 60 * 1000; // within 1 minute

    if (isNewUser) {
      router.replace("/onboarding");
    }
  }, [isLoaded, isSignedIn, user]);

  // Show loading indicator while Clerk is initializing
  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Render the main tab layout once authenticated
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "white",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#333333",
          borderRadius: 50,
          paddingBottom: 0,
          overflow: "hidden",
          marginHorizontal: 20,
          marginBottom: 20,
          height: 78,
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          position: "absolute",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Jobs",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.home} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.profile} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon source={icons.chat} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
