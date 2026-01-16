import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function Train() {
  return (
    <ScrollView className="flex-1 bg-white px-6 pt-16">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-3xl font-bold text-gray-900">
          Get Trained 👋
        </Text>
        <Text className="text-gray-500 mt-2 text-base">
          Learn how to succeed as a tasker and get more jobs faster.
        </Text>
      </View>

      {/* Training Cards */}
      <View className="space-y-4">
        <TrainingCard
          title="How the Platform Works"
          description="Understand bookings, payments, and ratings."
          onPress={() => router.push("/")}
        />

        <TrainingCard
          title="Getting More Jobs"
          description="Tips to improve your profile and get selected."
          onPress={() => router.push("/")}
        />

        <TrainingCard
          title="Safety & Trust"
          description="Learn best practices for safe and professional work."
          onPress={() => router.push("/")}
        />

        <TrainingCard
          title="Payments & Payouts"
          description="How you get paid and avoid payment issues."
          onPress={() => router.push("/")}
        />
      </View>

      {/* CTA */}
      <View className="mt-12 mb-10">
        <TouchableOpacity
          onPress={() => router.replace("/(root)/home")}
          className="bg-black py-4 rounded-2xl"
        >
          <Text className="text-white text-center font-semibold text-base">
            Start Taking Jobs
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function TrainingCard({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="border border-gray-200 rounded-2xl p-5"
    >
      <Text className="text-lg font-semibold text-gray-900">
        {title}
      </Text>
      <Text className="text-gray-500 mt-1">
        {description}
      </Text>
    </TouchableOpacity>
  );
}
