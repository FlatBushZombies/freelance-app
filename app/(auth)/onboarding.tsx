import { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  UserIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CheckIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  SparklesIcon,
  Cog6ToothIcon,
  PaintBrushIcon,
  TruckIcon,
  Squares2X2Icon,
} from "react-native-heroicons/solid";
import { getApiUrl } from "@/lib/fetch";
import { showErrorToast, showInfoToast } from "@/lib/toast";
import { COLORS, RADIUS, SHADOW } from "@/constants/theme";

const SKILL_OPTIONS = [
  { label: "Plumbing", Icon: WrenchScrewdriverIcon },
  { label: "Electrical", Icon: BoltIcon },
  { label: "Cleaning", Icon: SparklesIcon },
  { label: "Carpentry", Icon: Cog6ToothIcon },
  { label: "Painting", Icon: PaintBrushIcon },
  { label: "Moving", Icon: TruckIcon },
  { label: "Other", Icon: Squares2X2Icon },
];

const EXPERIENCE_LEVELS = [
  { label: "Beginner", subtitle: "0-2 years", value: "Beginner (0-2 years)" },
  { label: "Intermediate", subtitle: "2-5 years", value: "Intermediate (2-5 years)" },
  { label: "Expert", subtitle: "5+ years", value: "Expert (5+ years)" },
];

function parseStoredSkills(raw: string) {
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const known = SKILL_OPTIONS.map((s) => s.label).filter((label) => label !== "Other");
  const selected = parts.filter((part) => known.includes(part));
  const custom = parts.filter((part) => !known.includes(part)).join(", ");
  return { selected, custom };
}

const Onboarding = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
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
          getApiUrl(`/api/user/get?clerkId=${user.id}`)
        );
        const data = await res.json();

        if (data.user?.completedOnboarding === true) {
          router.replace("/(root)/home");
          return;
        }

        setFullName(data.user?.name || user.fullName || "");
        if (data.user?.skills) {
          const { selected, custom } = parseStoredSkills(data.user.skills);
          setSelectedSkills(selected);
          setCustomSkill(custom);
        }
        setExperienceLevel(data.user?.experienceLevel || "");
        setHourlyRate(data.user?.hourlyRate?.toString() || "");
      } catch (err) {
        console.error("Error checking onboarding:", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkOnboarding();
  }, [router, user, isLoaded, isNavigationReady]);

  const toggleSkill = (label: string) => {
    setSelectedSkills((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const hasAnySkill = selectedSkills.length > 0 || customSkill.trim().length > 0;

  const isFormValid = () =>
    fullName.trim().length > 0 &&
    hasAnySkill &&
    experienceLevel.length > 0 &&
    hourlyRate.trim().length > 0 &&
    !isNaN(parseFloat(hourlyRate)) &&
    parseFloat(hourlyRate) > 0;

  const handleSubmit = async () => {
    if (!isFormValid()) {
      showInfoToast("Required Fields", "Please fill in all fields to continue");
      return;
    }

    if (!user?.id) {
      showErrorToast("Error", "User not loaded. Please try again.");
      return;
    }

    setLoading(true);

    const skillsValue = [...selectedSkills, customSkill.trim()]
      .filter(Boolean)
      .join(", ");

    try {
      const response = await fetch(
        getApiUrl("/api/user/update"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            name: fullName.trim(),
            skills: skillsValue,
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
      showErrorToast("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || checkingStatus) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.surface }}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={{ fontFamily: "Quicksand-SemiBold", color: COLORS.textMuted, fontSize: 14, marginTop: 16 }}>
          Preparing your profile...
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.surface, COLORS.navySoft]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <LinearGradient
              colors={[COLORS.navy, COLORS.navyDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: RADIUS.xxl,
                padding: 28,
                marginBottom: 24,
                ...SHADOW.raised,
                shadowColor: COLORS.navyDark,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: RADIUS.lg,
                  backgroundColor: "rgba(255,255,255,0.14)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                <UserIcon size={26} color="#FFFFFF" />
              </View>
              <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 24, color: "#FFFFFF", lineHeight: 30 }}>
                Let&apos;s set up your profile
              </Text>
              <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 14, color: "rgba(255,255,255,0.75)", marginTop: 8, lineHeight: 20 }}>
                Tell us about yourself so we can match you with the right jobs the moment they&apos;re posted.
              </Text>
            </LinearGradient>

            {/* Form Card */}
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: RADIUS.xxl,
                padding: 22,
                marginBottom: 20,
                ...SHADOW.card,
              }}
            >
              {/* Full Name */}
              <View style={{ marginBottom: 26 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: RADIUS.sm,
                      backgroundColor: COLORS.navy,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <UserIcon size={17} color="#FFFFFF" />
                  </View>
                  <Text style={{ fontFamily: "Quicksand-SemiBold", fontSize: 15, color: COLORS.textPrimary }}>
                    Full Name
                  </Text>
                </View>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textMuted}
                  style={{
                    fontFamily: "Quicksand-Medium",
                    backgroundColor: COLORS.surfaceMuted,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    color: COLORS.textPrimary,
                    fontSize: 15,
                  }}
                />
              </View>

              {/* Skills */}
              <View style={{ marginBottom: 26 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: RADIUS.sm,
                      backgroundColor: COLORS.navy,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <WrenchScrewdriverIcon size={17} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Quicksand-SemiBold", fontSize: 15, color: COLORS.textPrimary }}>
                      Your Skills
                    </Text>
                    <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 12, color: COLORS.textMuted, marginTop: 1 }}>
                      Pick everything you take jobs for
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  {SKILL_OPTIONS.map(({ label, Icon }) => {
                    const active = selectedSkills.includes(label);
                    return (
                      <TouchableOpacity
                        key={label}
                        onPress={() => toggleSkill(label)}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 7,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderRadius: RADIUS.pill,
                          borderWidth: 1.5,
                          borderColor: active ? COLORS.navy : COLORS.border,
                          backgroundColor: active ? COLORS.navy : COLORS.surfaceMuted,
                        }}
                      >
                        <Icon size={15} color={active ? "#FFFFFF" : COLORS.textSecondary} />
                        <Text
                          style={{
                            fontFamily: "Quicksand-SemiBold",
                            fontSize: 13,
                            color: active ? "#FFFFFF" : COLORS.textSecondary,
                          }}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedSkills.includes("Other") && (
                  <TextInput
                    value={customSkill}
                    onChangeText={setCustomSkill}
                    placeholder="e.g. Appliance Repair, Landscaping"
                    placeholderTextColor={COLORS.textMuted}
                    style={{
                      marginTop: 12,
                      fontFamily: "Quicksand-Medium",
                      backgroundColor: COLORS.surfaceMuted,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      borderRadius: RADIUS.md,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      color: COLORS.textPrimary,
                      fontSize: 15,
                    }}
                  />
                )}
              </View>

              {/* Experience Level */}
              <View style={{ marginBottom: 26 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: RADIUS.sm,
                      backgroundColor: COLORS.navy,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <ChartBarIcon size={17} color="#FFFFFF" />
                  </View>
                  <Text style={{ fontFamily: "Quicksand-SemiBold", fontSize: 15, color: COLORS.textPrimary }}>
                    Experience Level
                  </Text>
                </View>
                <View style={{ gap: 10 }}>
                  {EXPERIENCE_LEVELS.map((level) => {
                    const active = experienceLevel === level.value;
                    return (
                      <TouchableOpacity
                        key={level.value}
                        onPress={() => setExperienceLevel(level.value)}
                        activeOpacity={0.7}
                        style={{
                          borderRadius: RADIUS.md,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          borderWidth: 1.5,
                          borderColor: active ? COLORS.navy : COLORS.border,
                          backgroundColor: active ? COLORS.navy : COLORS.surfaceMuted,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <View>
                            <Text
                              style={{
                                fontFamily: "Quicksand-SemiBold",
                                fontSize: 15,
                                color: active ? "#FFFFFF" : COLORS.textPrimary,
                              }}
                            >
                              {level.label}
                            </Text>
                            <Text
                              style={{
                                fontFamily: "Quicksand-Medium",
                                fontSize: 12,
                                marginTop: 2,
                                color: active ? "rgba(255,255,255,0.75)" : COLORS.textMuted,
                              }}
                            >
                              {level.subtitle}
                            </Text>
                          </View>
                          {active && (
                            <View
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: 13,
                                backgroundColor: "#FFFFFF",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <CheckIcon size={15} color={COLORS.navy} />
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
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: RADIUS.sm,
                      backgroundColor: COLORS.navy,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <CurrencyDollarIcon size={17} color="#FFFFFF" />
                  </View>
                  <Text style={{ fontFamily: "Quicksand-SemiBold", fontSize: 15, color: COLORS.textPrimary }}>
                    Hourly Rate (USD)
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: COLORS.surfaceMuted,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ fontFamily: "Quicksand-SemiBold", fontSize: 17, color: COLORS.textMuted, marginRight: 8 }}>
                    $
                  </Text>
                  <TextInput
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    placeholder="50"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    style={{ fontFamily: "Quicksand-Medium", flex: 1, color: COLORS.textPrimary, fontSize: 15 }}
                  />
                  <View style={{ backgroundColor: COLORS.border, borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 11, color: COLORS.textSecondary }}>
                      /hour
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Notification promise */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: COLORS.navySoft,
                borderRadius: RADIUS.md,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: COLORS.borderSoft,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: RADIUS.sm,
                  backgroundColor: COLORS.surface,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                  marginTop: 1,
                }}
              >
                <BellIcon size={15} color={COLORS.navy} />
              </View>
              <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 13, color: COLORS.navy, lineHeight: 19, flex: 1 }}>
                We&apos;ll notify you the moment a client posts a job matching these skills. You can update them anytime in your profile.
              </Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingBottom: 28,
              paddingTop: 18,
              backgroundColor: COLORS.surface,
              borderTopLeftRadius: RADIUS.xxl,
              borderTopRightRadius: RADIUS.xxl,
              shadowColor: COLORS.textPrimary,
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isFormValid() || loading}
              activeOpacity={0.85}
              style={{
                borderRadius: RADIUS.md,
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                backgroundColor: !isFormValid() || loading ? COLORS.border : COLORS.navy,
                ...(!isFormValid() || loading ? {} : { ...SHADOW.raised, shadowColor: COLORS.navy }),
              }}
            >
              <Text style={{ fontFamily: "Quicksand-Bold", color: "#FFFFFF", fontSize: 16 }}>
                {loading ? "Setting up your profile..." : "Get Started"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading Overlay */}
          {loading && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(15,23,42,0.5)",
              }}
            >
              <View
                style={{
                  backgroundColor: COLORS.surface,
                  borderRadius: RADIUS.xxl,
                  padding: 36,
                  alignItems: "center",
                  marginHorizontal: 32,
                  ...SHADOW.raised,
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: COLORS.surfaceMuted,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  <ActivityIndicator size="large" color={COLORS.navy} />
                </View>
                <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 17, color: COLORS.textPrimary, marginBottom: 4 }}>
                  Creating your profile...
                </Text>
                <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 13, color: COLORS.textMuted }}>
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
