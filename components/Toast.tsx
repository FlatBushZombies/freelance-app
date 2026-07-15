import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "react-native-heroicons/solid";
import type { ToastConfigParams } from "react-native-toast-message";
import { RADIUS, SHADOW } from "@/constants/theme";

function ToastCard({
  text1,
  text2,
  accent,
  Icon,
}: {
  text1?: string;
  text2?: string;
  accent: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: "92%",
        opacity,
        transform: [{ scale }, { translateY }],
        borderRadius: RADIUS.xl,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.09)",
        ...SHADOW.raised,
      }}
    >
      <BlurView
        intensity={90}
        tint="dark"
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          backgroundColor: "rgba(18,18,22,0.55)",
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <Icon size={20} color={accent} />
        <View style={{ flex: 1 }}>
          {text1 ? (
            <Text
              style={{
                fontFamily: "Quicksand-Bold",
                fontSize: 14,
                color: "#FFFFFF",
              }}
              numberOfLines={2}
            >
              {text1}
            </Text>
          ) : null}
          {text2 ? (
            <Text
              style={{
                fontFamily: "Quicksand-Medium",
                fontSize: 12,
                lineHeight: 17,
                color: "rgba(255,255,255,0.72)",
                marginTop: 2,
              }}
              numberOfLines={3}
            >
              {text2}
            </Text>
          ) : null}
        </View>
      </BlurView>
    </Animated.View>
  );
}

export const toastConfig = {
  success: ({ text1, text2 }: ToastConfigParams<unknown>) => (
    <ToastCard text1={text1} text2={text2} accent="#7EE3B0" Icon={CheckCircleIcon} />
  ),
  error: ({ text1, text2 }: ToastConfigParams<unknown>) => (
    <ToastCard text1={text1} text2={text2} accent="#FCA5A5" Icon={XCircleIcon} />
  ),
  info: ({ text1, text2 }: ToastConfigParams<unknown>) => (
    <ToastCard text1={text1} text2={text2} accent="#93C5FD" Icon={InformationCircleIcon} />
  ),
};
