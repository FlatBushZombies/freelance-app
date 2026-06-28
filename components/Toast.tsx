import React from "react";
import { Text, View } from "react-native";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "react-native-heroicons/solid";
import type { ToastConfigParams } from "react-native-toast-message";
import { COLORS, RADIUS, SHADOW } from "@/constants/theme";

function ToastCard({
  text1,
  text2,
  accent,
  accentSoft,
  Icon,
}: {
  text1?: string;
  text2?: string;
  accent: string;
  accentSoft: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <View
      style={{
        width: "92%",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderLeftWidth: 4,
        borderLeftColor: accent,
        paddingVertical: 14,
        paddingHorizontal: 14,
        ...SHADOW.raised,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: accentSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        {text1 ? (
          <Text
            style={{ fontFamily: "Quicksand-Bold", fontSize: 14, color: COLORS.textPrimary }}
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
              color: COLORS.textSecondary,
              marginTop: 2,
            }}
            numberOfLines={3}
          >
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const toastConfig = {
  success: ({ text1, text2 }: ToastConfigParams<unknown>) => (
    <ToastCard
      text1={text1}
      text2={text2}
      accent={COLORS.success}
      accentSoft={COLORS.successSoft}
      Icon={CheckCircleIcon}
    />
  ),
  error: ({ text1, text2 }: ToastConfigParams<unknown>) => (
    <ToastCard
      text1={text1}
      text2={text2}
      accent={COLORS.error}
      accentSoft={COLORS.errorSoft}
      Icon={XCircleIcon}
    />
  ),
  info: ({ text1, text2 }: ToastConfigParams<unknown>) => (
    <ToastCard
      text1={text1}
      text2={text2}
      accent={COLORS.navy}
      accentSoft={COLORS.navySoft}
      Icon={InformationCircleIcon}
    />
  ),
};
