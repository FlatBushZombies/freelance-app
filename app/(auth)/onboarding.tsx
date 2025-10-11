import { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Image,
  ActivityIndicator,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const Onboarding = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Form data
  const [fullName, setFullName] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const [loading, setLoading] = useState(false);
  const totalSteps = 4;

  // Check if user already completed onboarding
  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      // No user session → redirect to home/root
      router.replace("/");
      return;
    }

    // Optional: fetch from API to check if user already exists / completed onboarding
    const checkOnboarding = async () => {
      try {
        const res = await fetch(
          `https://quickhands-api.vercel.app/api/user/${user.id}`
        );
        const data = await res.json();
        if (data.user?.completedOnboarding) {
          router.replace("/(root)/home");
        } else {
          // Prefill name if available
          setFullName(user.fullName || "");
        }
      } catch (err) {
        console.error("Error checking onboarding:", err);
      }
    };
    checkOnboarding();
  }, [user, isLoaded]);

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(callback, 150);
  };

  const handleNext = () => {
    if (currentStep === 1 && !fullName.trim()) {
      Alert.alert("Required", "Please enter your full name");
      return;
    }
    if (currentStep === 2 && !skills.trim()) {
      Alert.alert("Required", "Please enter your skills or expertise");
      return;
    }
    if (currentStep === 3 && !experienceLevel) {
      Alert.alert("Required", "Please select your experience level");
      return;
    }

    if (currentStep < totalSteps) {
      animateTransition(() => setCurrentStep(currentStep + 1));
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      animateTransition(() => setCurrentStep(currentStep - 1));
    }
  };

  const handleFinish = async () => {
    if (!hourlyRate.trim()) {
      Alert.alert("Required", "Please enter your hourly rate");
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
            name: fullName,
            skills,
            experienceLevel,
            hourlyRate: parseFloat(hourlyRate),
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

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return fullName.trim().length > 0;
      case 2:
        return skills.trim().length > 0;
      case 3:
        return experienceLevel.length > 0;
      case 4:
        return hourlyRate.trim().length > 0;
      default:
        return false;
    }
  };

  if (!isLoaded || !user) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#111827" />
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
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingTop: 40, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration Area */}
          <View className="items-center mb-8">
            <View className="w-80 h-64 items-center justify-center">
              <Image
                source={{
                  uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/freelance-animator-get-a-quote.jpg-LcEVYb5xNc7ZhcNSKGW99Tdksw4UGf.webp",
                }}
                style={{ width: 320, height: 256 }}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Header */}
          <Text className="text-orange-500 text-sm font-semibold mb-2 tracking-wide uppercase">
            Onboarding
          </Text>
          <Text className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
            A few quick questions to{"\n"}customize your experience.
          </Text>

          {/* Progress Indicator */}
          <View className="flex-row items-center mb-8">
            <Text className="text-gray-400 text-sm font-medium">
              {currentStep}/{totalSteps}
            </Text>
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-3 overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${(currentStep / totalSteps) * 100}%`,
                  backgroundColor: "#111827",
                }}
              />
            </View>
          </View>

          {/* Form Steps */}
          <Animated.View style={{ opacity: fadeAnim }}>
            {currentStep === 1 && (
              <View>
                <View className="flex-row items-center mb-4">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: "#111827" }}
                  >
                    <Text className="text-white text-lg">👤</Text>
                  </View>
                  <Text className="text-gray-900 font-semibold text-lg">
                    Full Name
                  </Text>
                </View>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-white border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-base shadow-sm"
                  autoFocus
                />
              </View>
            )}

            {currentStep === 2 && (
              <View>
                <View className="flex-row items-center mb-4">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: "#111827" }}
                  >
                    <Text className="text-white text-lg">⚡</Text>
                  </View>
                  <Text className="text-gray-900 font-semibold text-lg">
                    What are your skills?
                  </Text>
                </View>
                <TextInput
                  value={skills}
                  onChangeText={setSkills}
                  placeholder="e.g. Web Design, React, Copywriting"
                  placeholderTextColor="#9CA3AF"
                  className="bg-white border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 text-base shadow-sm"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  autoFocus
                />
              </View>
            )}

            {currentStep === 3 && (
              <View>
                <View className="flex-row items-center mb-4">
                  <Text className="text-gray-900 font-semibold text-lg">
                    Experience Level
                  </Text>
                </View>
                <View className="space-y-3">
                  {[
                    "Beginner (0-2 years)",
                    "Intermediate (2-5 years)",
                    "Expert (5+ years)",
                  ].map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setExperienceLevel(level)}
                      className={`bg-white border-2 rounded-2xl px-5 py-4 shadow-sm ${
                        experienceLevel === level
                          ? "bg-gray-50"
                          : "border-gray-200"
                      }`}
                      style={
                        experienceLevel === level ? { borderColor: "#111827" } : {}
                      }
                    >
                      <Text
                        className={`text-base font-medium ${
                          experienceLevel === level ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {currentStep === 4 && (
              <View>
                <View className="flex-row items-center mb-4">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: "#111827" }}
                  >
                    <Text className="text-white text-lg">💰</Text>
                  </View>
                  <Text className="text-gray-900 font-semibold text-lg">
                    Hourly Rate (USD)
                  </Text>
                </View>
                <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                  <Text className="text-gray-500 text-lg mr-2">$</Text>
                  <TextInput
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    placeholder="50"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="flex-1 text-gray-900 text-base"
                    autoFocus
                  />
                  <Text className="text-gray-400 text-sm">/hour</Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Helper Text */}
          <View className="mt-6 bg-orange-50 rounded-2xl px-5 py-4 border border-orange-100">
            <Text className="text-orange-800 text-sm leading-relaxed">
              {currentStep === 1 && "Let's start with your good name!"}
              {currentStep === 2 &&
                "Tell us what you're great at. This helps clients find you."}
              {currentStep === 3 &&
                "This helps us match you with the right projects."}
              {currentStep === 4 &&
                "Set your rate. You can always change this later."}
            </Text>
          </View>
        </ScrollView>

        
        <View className="px-6 pb-6 pt-4 bg-white border-t border-gray-100">
          <View className="flex-row space-x-3">
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={handleBack}
                className="flex-1 bg-gray-100 rounded-2xl py-4 items-center justify-center"
              >
                <Text className="text-gray-700 text-base font-semibold">Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleNext}
              disabled={!isStepValid() || loading}
              className="flex-1 rounded-2xl py-4 items-center justify-center shadow-lg"
              style={{
                backgroundColor: !isStepValid() || loading ? "#D1D5DB" : "#111827",
              }}
            >
              <Text className="text-white text-base font-bold">
                {loading
                  ? "Saving..."
                  : currentStep === totalSteps
                  ? "Finish"
                  : "Continue"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        
        {loading && (
          <View className="absolute inset-0 justify-center items-center bg-black/30">
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Onboarding;
