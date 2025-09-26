import { Text, View, TouchableOpacity, Image, Linking } from "react-native";
import { IMAGES } from "@/constants";
import { router } from "expo-router";

export default function Index() {

  const handleSignIn = () => {
    router.replace('/(auth)/signin')
  }
  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-4xl font-bold text-gray-900 mb-6 text-center">
        Make money with your skills
      </Text>

      <Image
        source={IMAGES.illustration}
        className="w-72 h-44 mb-10 rounded-xl"
        resizeMode="cover"
      />

      <View className="w-full items-center space-y-5">
        <TouchableOpacity className="bg-primary rounded-full py-4 w-4/5 items-center">
          <Text className="text-white font-semibold text-lg">I want to offer services</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignIn}>
          <Text className="text-blue-600 underline font-medium text-base">
            I want to look for services
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
