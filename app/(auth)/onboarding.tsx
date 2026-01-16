import { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const Onboarding = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Form data
  const [fullName, setFullName] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Wait for navigation to be ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Check if user already completed onboarding
  useEffect(() => {
    if (!isLoaded || !isNavigationReady) return;

    if (!user) {
      router.replace("/");
      return;
    }

    const checkOnboarding = async () => {
      try {
        const res = await fetch(
          `https://quickhands-api.vercel.app/api/user/${user.id}`
        );
        const data = await res.json();
        
        // If user has completed onboarding, redirect immediately
        if (data.user?.completedOnboarding === true) {
          router.replace("/(root)/home");
          return;
        }
        
        // Prefill name if available
        setFullName(data.user?.name || user.fullName || "");
        setSkills(data.user?.skills || "");
        setExperienceLevel(data.user?.experienceLevel || "");
        setHourlyRate(data.user?.hourlyRate?.toString() || "");
      } catch (err) {
        console.error("Error checking onboarding:", err);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    checkOnboarding();
  }, [user, isLoaded, isNavigationReady]);

  const isFormValid = () => {
    return (
      fullName.trim().length > 0 &&
      skills.trim().length > 0 &&
      experienceLevel.length > 0 &&
      hourlyRate.trim().length > 0 &&
      !isNaN(parseFloat(hourlyRate))
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert("Required Fields", "Please fill in all fields to continue");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not loaded. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://quickhands-api.vercel.app/api/user/update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            name: fullName.trim(),
            skills: skills.trim(),
            experienceLevel,
            hourlyRate: parseFloat(hourlyRate),
            completedOnboarding: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update user");
      }

      // Successfully updated → route to home
      router.replace("/(root)/home");
    } catch (error) {
      console.error("Onboarding Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || checkingStatus) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="text-gray-500 text-sm mt-4 font-semibold">Preparing your profile...</Text>
      </View>
    )
  }

  return (
    <LinearGradient
      colors={["#F8FAFC", "#FFFFFF", "#FEF3F2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            contentContainerStyle={{ paddingTop: 40, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Illustration */}
            <View className="items-center mb-6">
              <View className="w-64 h-48 items-center justify-center" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 }}>
                <Image
                  source={{
                    uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/freelance-animator-get-a-quote.jpg-LcEVYb5xNc7ZhcNSKGW99Tdksw4UGf.webp",
                  }}
                  style={{ width: 256, height: 192 }}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Header */}
            <Text className="text-orange-500 text-sm font-semibold mb-2 tracking-wide uppercase" style={{ letterSpacing: 1.2 }}>
              Welcome to QuickHands
            </Text>
            <Text className="text-3xl font-bold text-gray-900 mb-2 leading-tight" style={{ textShadowColor: "rgba(0, 0, 0, 0.02)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              Let us set up your profile
            </Text>
            <Text className="text-gray-500 text-base mb-8 leading-relaxed" style={{ lineHeight: 24 }}>
              Tell us about yourself so we can match you with the perfect gigs.
            </Text>

            {/* Full Name */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: "#111827" }}
                >
                  <Text className="text-white text-base">👤</Text>
                </View>
                <Text className="text-gray-900 font-semibold text-base">
                  Full Name
                </Text>
              </View>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-base"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
              />
            </View>

            {/* Skills */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: "#111827" }}
                >
                  <Text className="text-white text-base">⚡</Text>
                </View>
                <Text className="text-gray-900 font-semibold text-base">
                  Your Skills
                </Text>
              </View>
              <TextInput
                value={skills}
                onChangeText={setSkills}
                placeholder="e.g. Web Design, React, Copywriting"
                placeholderTextColor="#9CA3AF"
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-base"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Experience Level */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: "#111827" }}
                >
                  <Text className="text-white text-base">📊</Text>
                </View>
                <Text className="text-gray-900 font-semibold text-base">
                  Experience Level
                </Text>
              </View>
              <View className="space-y-3">
                {[
                  { label: "Beginner", subtitle: "0-2 years", value: "Beginner (0-2 years)" },
                  { label: "Intermediate", subtitle: "2-5 years", value: "Intermediate (2-5 years)" },
                  { label: "Expert", subtitle: "5+ years", value: "Expert (5+ years)" },
                ].map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    onPress={() => setExperienceLevel(level.value)}
                    activeOpacity={0.8}
                    className={`bg-white border-2 rounded-2xl px-5 py-4 ${
                      experienceLevel === level.value ? "bg-gray-50" : "border-gray-200"
                    }`}
                    style={[
                      { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
                      experienceLevel === level.value
                        ? { borderColor: "#111827", shadowOpacity: 0.08, shadowRadius: 12 }
                        : {}
                    ]}
                  >
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text
                          className={`text-base font-semibold ${
                            experienceLevel === level.value
                              ? "text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {level.label}
                        </Text>
                        <Text className="text-gray-500 text-sm mt-0.5">
                          {level.subtitle}
                        </Text>
                      </View>
                      {experienceLevel === level.value && (
                        <View
                          className="w-6 h-6 rounded-full items-center justify-center"
                          style={{ backgroundColor: "#111827" }}
                        >
                          <Text className="text-white text-xs">✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Hourly Rate */}
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: "#111827" }}
                >
                  <Text className="text-white text-base">💰</Text>
                </View>
                <Text className="text-gray-900 font-semibold text-base">
                  Hourly Rate (USD)
                </Text>
              </View>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-5 py-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                <Text className="text-gray-500 text-lg mr-2">$</Text>
                <TextInput
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="50"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="flex-1 text-gray-900 text-base"
                />
                <Text className="text-gray-400 text-sm">/hour</Text>
              </View>
            </View>

            {/* Info Box */}
            <View className="bg-orange-50 rounded-2xl px-5 py-4 border border-orange-100 mb-6">
              <Text className="text-orange-800 text-sm leading-relaxed">
                💡 Don&apos;t worry, you can update all of this information later in your profile settings.
              </Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View className="px-6 pb-6 pt-4 bg-white border-t border-gray-100" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isFormValid() || loading}
              activeOpacity={0.85}
              className="rounded-2xl py-4 items-center justify-center"
              style={[
                {
                  backgroundColor:
                    !isFormValid() || loading ? "#D1D5DB" : "#111827",
                },
                { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 }
              ]}
            >
              <Text className="text-white text-base font-bold">
                {loading ? "Setting up your profile..." : "Get Started"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading Overlay */}
          {loading && (
            <View className="absolute inset-0 justify-center items-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}>
              <View className="bg-white rounded-3xl p-8 items-center" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 30, elevation: 16 }}>
                <ActivityIndicator size="large" color="#111827" />
                <Text className="text-gray-900 font-semibold mt-4 text-base">
                  Creating your profile...
                </Text>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Onboarding;