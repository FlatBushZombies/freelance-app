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
import {
  UserIcon,
  BoltIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CheckIcon,
  LightBulbIcon,
} from "react-native-heroicons/solid";

const Onboarding = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsNavigationReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded || !isNavigationReady) return;

    if (!user) {
      router.replace("/");
      return;
    }

    const checkOnboarding = async () => {
      try {
        const res = await fetch(
          `https://quickhands-api.vercel.app/api/user/get?clerkId=${user.id}`
        );
        const data = await res.json();

        if (data.user?.completedOnboarding === true) {
          router.replace("/(root)/home");
          return;
        }

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

  const isFormValid = () =>
    fullName.trim().length > 0 &&
    skills.trim().length > 0 &&
    experienceLevel.length > 0 &&
    hourlyRate.trim().length > 0 &&
    !isNaN(parseFloat(hourlyRate));

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
        <Text className="font-quicksand-semibold text-gray-500 text-sm mt-4">
          Preparing your profile...
        </Text>
      </View>
    );
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
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Illustration Card */}
            <View
              className="bg-white rounded-3xl p-6 mb-8 items-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.08,
                shadowRadius: 24,
                elevation: 6,
              }}
            >
              <Image
                source={{
                  uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/freelance-animator-get-a-quote.jpg-LcEVYb5xNc7ZhcNSKGW99Tdksw4UGf.webp",
                }}
                style={{ width: 220, height: 165 }}
                resizeMode="contain"
              />
            </View>

            {/* Header Section */}
            <View className="mb-8">
              <Text className="font-quicksand-semibold text-orange-500 text-xs mb-3 tracking-widest uppercase">
                Welcome to QuickHands
              </Text>
              <Text
                className="font-quicksand-bold text-3xl text-gray-900 mb-3"
                style={{ lineHeight: 38 }}
              >
                Let us set up your profile
              </Text>
              <Text className="font-quicksand-medium text-gray-500 text-base leading-6">
                Tell us about yourself so we can match you with the perfect gigs.
              </Text>
            </View>

            {/* Form Card */}
            <View
              className="bg-white rounded-3xl p-6 mb-6"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.06,
                shadowRadius: 20,
                elevation: 4,
              }}
            >
              {/* Full Name */}
              <View className="mb-7">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3 bg-gray-900">
                    <UserIcon size={18} color="#FFFFFF" />
                  </View>
                  <Text className="font-quicksand-semibold text-gray-900 text-base">
                    Full Name
                  </Text>
                </View>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  className="font-quicksand bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-gray-900 text-base"
                />
              </View>

              {/* Skills */}
              <View className="mb-7">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3 bg-gray-900">
                    <BoltIcon size={18} color="#FFFFFF" />
                  </View>
                  <Text className="font-quicksand-semibold text-gray-900 text-base">
                    Your Skills
                  </Text>
                </View>
                <TextInput
                  value={skills}
                  onChangeText={setSkills}
                  placeholder="e.g. Web Design, React, Copywriting"
                  placeholderTextColor="#9CA3AF"
                  className="font-quicksand bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-gray-900 text-base"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                />
              </View>

              {/* Experience Level */}
              <View className="mb-7">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3 bg-gray-900">
                    <ChartBarIcon size={18} color="#FFFFFF" />
                  </View>
                  <Text className="font-quicksand-semibold text-gray-900 text-base">
                    Experience Level
                  </Text>
                </View>
                <View className="gap-3">
                  {[
                    { label: "Beginner", subtitle: "0-2 years", value: "Beginner (0-2 years)" },
                    { label: "Intermediate", subtitle: "2-5 years", value: "Intermediate (2-5 years)" },
                    { label: "Expert", subtitle: "5+ years", value: "Expert (5+ years)" },
                  ].map((level) => {
                    const active = experienceLevel === level.value;
                    return (
                      <TouchableOpacity
                        key={level.value}
                        onPress={() => setExperienceLevel(level.value)}
                        activeOpacity={0.7}
                        className={`rounded-2xl px-5 py-4 border-2 ${
                          active
                            ? "bg-gray-900 border-gray-900"
                            : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <View>
                            <Text
                              className={`font-quicksand-semibold text-base ${
                                active ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {level.label}
                            </Text>
                            <Text
                              className={`font-quicksand text-sm mt-1 ${
                                active ? "text-gray-300" : "text-gray-500"
                              }`}
                            >
                              {level.subtitle}
                            </Text>
                          </View>
                          {active && (
                            <View className="w-7 h-7 rounded-full items-center justify-center bg-white">
                              <CheckIcon size={16} color="#111827" />
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Hourly Rate */}
              <View>
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3 bg-gray-900">
                    <CurrencyDollarIcon size={18} color="#FFFFFF" />
                  </View>
                  <Text className="font-quicksand-semibold text-gray-900 text-base">
                    Hourly Rate (USD)
                  </Text>
                </View>
                <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
                  <Text className="font-quicksand-semibold text-gray-400 text-lg mr-2">
                    $
                  </Text>
                  <TextInput
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    placeholder="50"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="font-quicksand flex-1 text-gray-900 text-base"
                  />
                  <View className="bg-gray-200 rounded-xl px-3 py-1.5">
                    <Text className="font-quicksand-medium text-gray-600 text-xs">
                      /hour
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Info Box */}
            <View className="flex-row bg-orange-50 rounded-2xl px-5 py-4 border border-orange-100 items-start">
              <View className="w-8 h-8 rounded-xl bg-orange-100 items-center justify-center mr-3 mt-0.5">
                <LightBulbIcon size={16} color="#C2410C" />
              </View>
              <Text className="font-quicksand-medium text-orange-800 text-sm leading-6 flex-1">
                Don&apos;t worry, you can update all of this information later in your profile settings.
              </Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View
            className="px-6 pb-8 pt-5 bg-white"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 8,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
            }}
          >
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isFormValid() || loading}
              activeOpacity={0.85}
              className="rounded-2xl py-5 items-center justify-center flex-row"
              style={{
                backgroundColor: !isFormValid() || loading ? "#D1D5DB" : "#111827",
                shadowColor: "#111827",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: !isFormValid() || loading ? 0 : 0.25,
                shadowRadius: 20,
                elevation: !isFormValid() || loading ? 0 : 10,
              }}
            >
              <Text className="font-quicksand-bold text-white text-lg">
                {loading ? "Setting up your profile..." : "Get Started"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading Overlay */}
          {loading && (
            <View
              className="absolute inset-0 justify-center items-center"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <View
                className="bg-white rounded-3xl p-10 items-center mx-8"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 24 },
                  shadowOpacity: 0.35,
                  shadowRadius: 40,
                  elevation: 20,
                }}
              >
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-5">
                  <ActivityIndicator size="large" color="#111827" />
                </View>
                <Text className="font-quicksand-bold text-gray-900 text-lg mb-1">
                  Creating your profile...
                </Text>
                <Text className="font-quicksand text-gray-500 text-sm">
                  This will only take a moment
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