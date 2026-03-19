"use client"
import { useState } from "react"
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
} from "react-native"

interface ApplicationModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: { quotation: string; conditions: string }) => Promise<void>
  jobTitle: string
  jobBudget: number
}

export const ApplicationModal = ({
  visible,
  onClose,
  onSubmit,
  jobTitle,
  jobBudget,
}: ApplicationModalProps) => {
  const [quotation, setQuotation] = useState("")
  const [conditions, setConditions] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!quotation.trim()) return

    setSubmitting(true)
    try {
      await onSubmit({ quotation: quotation.trim(), conditions: conditions.trim() })
      setQuotation("")
      setConditions("")
      onClose()
    } catch (error) {
      console.error("Error submitting application:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const isDisabled = !quotation.trim() || submitting

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="px-6 pt-12 pb-5 border-b border-gray-100 bg-white">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-quicksand-bold text-2xl text-gray-900">
              Apply for Job
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="font-quicksand text-gray-600 text-lg">✕</Text>
            </TouchableOpacity>
          </View>
          <Text className="font-quicksand text-sm text-gray-600" numberOfLines={1}>
            {jobTitle}
          </Text>
          <View className="mt-2 bg-indigo-50 px-3 py-1.5 rounded-full self-start">
            <Text className="font-quicksand-semibold text-indigo-700 text-xs">
              Budget: ${jobBudget}/h
            </Text>
          </View>
        </View>

        {/* Form */}
        <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>

          {/* Quotation Input */}
          <View className="mb-6">
            <Text className="font-quicksand-bold text-base text-gray-900 mb-2">
              Your Quotation <Text className="text-red-500">*</Text>
            </Text>
            <Text className="font-quicksand text-sm text-gray-500 mb-3">
              Enter your proposed rate or total cost for this project
            </Text>
            <View className="bg-gray-50 rounded-2xl px-4 py-4 border-2 border-gray-100">
              <View className="flex-row items-center">
                <Text className="text-2xl text-gray-400 mr-2">💰</Text>
                <Text className="font-quicksand-semibold text-xl text-gray-500 mr-2">$</Text>
                <TextInput
                  value={quotation}
                  onChangeText={setQuotation}
                  placeholder="e.g., 50/hour or 2500 total"
                  placeholderTextColor="#9CA3AF"
                  className="font-quicksand-semibold flex-1 text-lg text-gray-900"
                  keyboardType="default"
                  autoFocus
                />
              </View>
            </View>
          </View>

          {/* Conditions Input */}
          <View className="mb-6">
            <Text className="font-quicksand-bold text-base text-gray-900 mb-2">
              Terms & Conditions
            </Text>
            <Text className="font-quicksand text-sm text-gray-500 mb-3">
              Any special requirements, timeline, or conditions (optional)
            </Text>
            <View className="bg-gray-50 rounded-2xl px-4 py-4 border-2 border-gray-100">
              <TextInput
                value={conditions}
                onChangeText={setConditions}
                placeholder="e.g., Available to start immediately. Require 50% upfront payment..."
                placeholderTextColor="#9CA3AF"
                className="font-quicksand text-base text-gray-900 min-h-[100px]"
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Info Card */}
          <View className="bg-blue-50 rounded-2xl px-4 py-4 mb-6 border border-blue-100">
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">ℹ️</Text>
              <View className="flex-1">
                <Text className="font-quicksand-semibold text-sm text-blue-900 mb-1">
                  First 5 applicants only
                </Text>
                <Text className="font-quicksand text-xs text-blue-700 leading-5">
                  Only the first 5 freelancers will be shown to the client. Apply quickly
                  with competitive rates!
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isDisabled}
            activeOpacity={0.85}
            className={`w-full py-5 rounded-2xl items-center justify-center ${
              isDisabled ? "bg-gray-300" : "bg-indigo-600"
            }`}
            style={{
              shadowColor: isDisabled ? "#9CA3AF" : "#4F46E5",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <Text className="font-quicksand-bold text-white text-lg mr-2">
                  ⚡ Submit Application
                </Text>
              </View>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}