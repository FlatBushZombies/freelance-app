"use client"
import { useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
} from "react-native"
import { COLORS, RADIUS, SHADOW } from "@/constants/theme"

export type ApplicationResult =
  | { status: "success"; conversationId?: string; otherClerkId?: string; otherDisplayName?: string; jobTitle?: string }
  | { status: "error"; message: string }
  | { status: "already_applied" }

interface ApplicationModalProps {
  visible: boolean
  onClose: () => void
  onOpenChat?: (conversationId: string, otherClerkId: string, otherDisplayName: string, jobTitle: string) => void
  onSubmit: (data: { quotation: string; conditions: string }) => Promise<ApplicationResult>
  jobTitle: string
  jobBudget: number
}

/* ─── Success screen ─── */
function SuccessView({
  jobTitle,
  result,
  onOpenChat,
  onDone,
}: {
  jobTitle: string
  result: Extract<ApplicationResult, { status: "success" }>
  onOpenChat?: () => void
  onDone: () => void
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start()
  }, [])

  const canOpenChat = !!(result.conversationId && result.otherClerkId)

  return (
    <Animated.View style={{ flex: 1, opacity: opacityAnim, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: COLORS.successSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          ...SHADOW.raised,
        }}
      >
        <Text style={{ fontSize: 44, lineHeight: 52 }}>✓</Text>
      </Animated.View>

      <Text style={{ fontSize: 26, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center", marginBottom: 8 }}>
        Application Sent!
      </Text>
      <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 8 }}>
        Your application for
      </Text>
      <View style={{ backgroundColor: COLORS.successSoft, borderRadius: RADIUS.sm, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 32, maxWidth: "100%" }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.success, textAlign: "center" }} numberOfLines={2}>
          {jobTitle}
        </Text>
      </View>

      <View style={{ width: "100%", backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.md, padding: 16, marginBottom: 28, borderWidth: 1, borderColor: COLORS.border }}>
        <Text style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 }}>
          🔔 The client has been notified and a coordination board has been opened. Check back for their response.
        </Text>
      </View>

      {canOpenChat && (
        <TouchableOpacity
          onPress={onOpenChat}
          activeOpacity={0.85}
          style={{
            width: "100%",
            backgroundColor: COLORS.navyDark,
            borderRadius: RADIUS.md,
            paddingVertical: 16,
            alignItems: "center",
            marginBottom: 12,
            ...SHADOW.raised,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Open Coordination Board</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onDone}
        activeOpacity={0.7}
        style={{
          width: "100%",
          borderWidth: 1.5,
          borderColor: COLORS.borderSoft,
          borderRadius: RADIUS.md,
          paddingVertical: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: COLORS.textSecondary, fontWeight: "600", fontSize: 15 }}>Back to Jobs</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

/* ─── Error screen ─── */
function ErrorView({
  message,
  onRetry,
  onClose,
}: {
  message: string
  onRetry: () => void
  onClose: () => void
}) {
  const shakeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Animated.View
        style={{
          transform: [{ translateX: shakeAnim }],
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: COLORS.errorSoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          ...SHADOW.card,
        }}
      >
        <Text style={{ fontSize: 42, lineHeight: 52 }}>✕</Text>
      </Animated.View>

      <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center", marginBottom: 12 }}>
        Application Failed
      </Text>

      <View style={{ backgroundColor: COLORS.errorSoft, borderRadius: RADIUS.md, padding: 16, marginBottom: 32, width: "100%", borderWidth: 1, borderColor: "#FCA5A5" }}>
        <Text style={{ fontSize: 14, color: COLORS.error, textAlign: "center", lineHeight: 20 }}>
          {message}
        </Text>
      </View>

      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.85}
        style={{
          width: "100%",
          backgroundColor: COLORS.navyDark,
          borderRadius: RADIUS.md,
          paddingVertical: 16,
          alignItems: "center",
          marginBottom: 12,
          ...SHADOW.raised,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Try Again</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.7}
        style={{ width: "100%", paddingVertical: 14, alignItems: "center" }}
      >
        <Text style={{ color: COLORS.textMuted, fontWeight: "600", fontSize: 15 }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  )
}

/* ─── Already applied screen ─── */
function AlreadyAppliedView({ onClose }: { onClose: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: "#FFF7ED",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          ...SHADOW.card,
        }}
      >
        <Text style={{ fontSize: 42, lineHeight: 52 }}>📋</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center", marginBottom: 12 }}>
        Already Applied
      </Text>
      <Text style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
        You've already submitted an application for this job. Check your boards for the latest status.
      </Text>
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.85}
        style={{
          width: "100%",
          backgroundColor: COLORS.navyDark,
          borderRadius: RADIUS.md,
          paddingVertical: 16,
          alignItems: "center",
          ...SHADOW.raised,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Got It</Text>
      </TouchableOpacity>
    </View>
  )
}

/* ─── Form screen ─── */
function FormView({
  jobTitle,
  jobBudget,
  onSubmit,
  onClose,
}: {
  jobTitle: string
  jobBudget: number
  onSubmit: (data: { quotation: string; conditions: string }) => void
  onClose: () => void
}) {
  const [quotation, setQuotation] = useState("")
  const [conditions, setConditions] = useState("")
  const isDisabled = !quotation.trim()

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Job context */}
      <View style={{ backgroundColor: COLORS.navySoft, borderRadius: RADIUS.md, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: COLORS.borderSoft }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: COLORS.navy, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>
          Applying for
        </Text>
        <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.navyDark }} numberOfLines={2}>
          {jobTitle}
        </Text>
        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ backgroundColor: COLORS.navySoft, borderRadius: RADIUS.lg, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.navy }}>
              Budget: US${jobBudget.toFixed(0)}
            </Text>
          </View>
          <View style={{ backgroundColor: COLORS.successSoft, borderRadius: RADIUS.lg, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: COLORS.success }}>5 spots max</Text>
          </View>
        </View>
      </View>

      {/* Quotation */}
      <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 }}>
        Your Quotation <Text style={{ color: COLORS.error }}>*</Text>
      </Text>
      <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 }}>
        Propose your rate or total cost for this project
      </Text>
      <View style={{ backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <Text style={{ fontSize: 22, color: COLORS.textMuted, marginRight: 8 }}>💰</Text>
        <Text style={{ fontSize: 18, fontWeight: "600", color: COLORS.textMuted, marginRight: 6 }}>US$</Text>
        <TextInput
          value={quotation}
          onChangeText={setQuotation}
          placeholder="e.g. 150/hour or 2 500 total"
          placeholderTextColor={COLORS.borderSoft}
          style={{ flex: 1, fontSize: 16, fontWeight: "600", color: COLORS.textPrimary }}
          keyboardType="default"
          autoFocus
        />
      </View>

      {/* Conditions */}
      <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 }}>
        Terms & Conditions
      </Text>
      <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 }}>
        Timeline, special requirements, or upfront payment terms (optional)
      </Text>
      <View style={{ backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 24 }}>
        <TextInput
          value={conditions}
          onChangeText={setConditions}
          placeholder="e.g. Available immediately. Require 50% upfront..."
          placeholderTextColor={COLORS.borderSoft}
          style={{ fontSize: 14, color: COLORS.textPrimary, minHeight: 80, textAlignVertical: "top" }}
          multiline
        />
      </View>

      {/* Info card */}
      <View style={{ backgroundColor: COLORS.navySoft, borderRadius: RADIUS.md, padding: 14, marginBottom: 28, borderWidth: 1, borderColor: COLORS.borderSoft, flexDirection: "row", gap: 10 }}>
        <Text style={{ fontSize: 18 }}>ℹ️</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: COLORS.navy, marginBottom: 2 }}>First 5 applicants only</Text>
          <Text style={{ fontSize: 12, color: COLORS.navy, lineHeight: 18 }}>
            Only the first 5 freelancers are shown to the client. Apply with a competitive rate!
          </Text>
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity
        onPress={() => onSubmit({ quotation: quotation.trim(), conditions: conditions.trim() })}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={{
          backgroundColor: isDisabled ? COLORS.border : COLORS.navyDark,
          borderRadius: RADIUS.md,
          paddingVertical: 16,
          alignItems: "center",
          marginBottom: 12,
          shadowColor: isDisabled ? "transparent" : COLORS.navyDark,
          ...(isDisabled ? {} : SHADOW.raised),
        }}
      >
        <Text style={{ color: isDisabled ? COLORS.textMuted : "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
          ⚡ Submit Application
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ paddingVertical: 12, alignItems: "center" }}>
        <Text style={{ color: COLORS.textMuted, fontWeight: "600", fontSize: 14 }}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

/* ─── Root modal ─── */
export const ApplicationModal = ({
  visible,
  onClose,
  onOpenChat,
  onSubmit,
  jobTitle,
  jobBudget,
}: ApplicationModalProps) => {
  type Screen = "form" | "submitting" | "success" | "error" | "already_applied"
  const [screen, setScreen] = useState<Screen>("form")
  const [result, setResult] = useState<ApplicationResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const prevVisible = useRef(visible)

  useEffect(() => {
    if (visible && !prevVisible.current) {
      setScreen("form")
      setResult(null)
      setErrorMsg("")
    }
    prevVisible.current = visible
  }, [visible])

  const handleFormSubmit = async (data: { quotation: string; conditions: string }) => {
    setScreen("submitting")
    try {
      const res = await onSubmit(data)
      setResult(res)
      if (res.status === "success") setScreen("success")
      else if (res.status === "already_applied") setScreen("already_applied")
      else {
        setErrorMsg((res as Extract<ApplicationResult, { status: "error" }>).message || "Please try again.")
        setScreen("error")
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Please try again.")
      setScreen("error")
    }
  }

  const handleRetry = () => {
    setScreen("form")
    setErrorMsg("")
    setResult(null)
  }

  const handleOpenChat = () => {
    if (result?.status === "success" && result.conversationId) {
      onOpenChat?.(
        result.conversationId,
        result.otherClerkId ?? "",
        result.otherDisplayName ?? "Client",
        result.jobTitle ?? jobTitle,
      )
    }
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={screen === "submitting" ? undefined : onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: COLORS.surface }}
      >
        {screen === "form" && (
          <View style={{ paddingHorizontal: 24, paddingTop: 52, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: COLORS.textPrimary }}>Apply for Job</Text>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceMuted, alignItems: "center", justifyContent: "center" }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, color: COLORS.textSecondary, fontWeight: "600" }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {screen === "form" && (
          <FormView jobTitle={jobTitle} jobBudget={jobBudget} onSubmit={handleFormSubmit} onClose={onClose} />
        )}

        {screen === "submitting" && (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <ActivityIndicator size="large" color={COLORS.navyDark} />
            <Text style={{ marginTop: 20, fontSize: 16, fontWeight: "600", color: COLORS.textSecondary }}>
              Submitting your application…
            </Text>
            <Text style={{ marginTop: 8, fontSize: 13, color: COLORS.textMuted, textAlign: "center" }}>
              Setting up your coordination board
            </Text>
          </View>
        )}

        {screen === "success" && result?.status === "success" && (
          <SuccessView
            jobTitle={jobTitle}
            result={result}
            onOpenChat={result.conversationId ? handleOpenChat : undefined}
            onDone={onClose}
          />
        )}

        {screen === "error" && (
          <ErrorView message={errorMsg} onRetry={handleRetry} onClose={onClose} />
        )}

        {screen === "already_applied" && (
          <AlreadyAppliedView onClose={onClose} />
        )}
      </KeyboardAvoidingView>
    </Modal>
  )
}
