"use client"

import { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native"
import { BellAlertIcon, BellIcon, XMarkIcon } from "react-native-heroicons/outline"
import { useNotifications } from "@/contexts/NotificationsContext"

interface NotificationBellProps {
  userId: string
}

export const NotificationBell = ({ userId: _userId }: NotificationBellProps) => {
  const {
    notifications,
    unreadCount,
    connected,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications()
  const [modalVisible, setModalVisible] = useState(false)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays > 0) return `${diffInDays}d ago`
    if (diffInHours > 0) return `${diffInHours}h ago`
    if (diffInMinutes > 0) return `${diffInMinutes}m ago`
    return "Just now"
  }

  const getNotificationCopy = (message: string) => {
    const normalized = message.toLowerCase()

    if (normalized.includes("in your area")) {
      return {
        title: "Job in your area",
        body: message,
        chip: "Area",
        color: "#15803D",
        bg: "#DCFCE7",
      }
    }

    if (normalized.includes("accepted") && (normalized.includes("phone number") || normalized.includes("contact"))) {
      return {
        title: "Offer accepted",
        body: "The client accepted your offer and shared contact details so you can continue directly.",
        chip: "Accepted",
        color: "#10B981",
        bg: "#D1FAE5",
      }
    }

    if (normalized.includes("accepted")) {
      return {
        title: "Offer accepted",
        body: "The client accepted your offer. You can expect contact sharing next if they want to connect directly.",
        chip: "Accepted",
        color: "#10B981",
        bg: "#D1FAE5",
      }
    }

    if (normalized.includes("rejected")) {
      return {
        title: "Offer rejected",
        body: "The client declined your offer for this job, so this application will not move forward.",
        chip: "Rejected",
        color: "#EF4444",
        bg: "#FEE2E2",
      }
    }

    if (normalized.includes("phone number") || normalized.includes("contact")) {
      return {
        title: "Contact shared",
        body: "The client shared contact details for this job, so you can now reach out directly.",
        chip: "Contact",
        color: "#0EA5E9",
        bg: "#E0F2FE",
      }
    }
    return {
      title: "Update",
      body: message,
      chip: "Update",
      color: "#6366F1",
      bg: "#E0E7FF",
    }
  }

  const renderNotification = ({ item }: { item: any }) => {
    const copy = getNotificationCopy(item.message)
    const showAreaBadge = item.message.toLowerCase().includes("in your area")

    return (
      <TouchableOpacity
        onPress={() => void markAsRead(item.id)}
        activeOpacity={0.7}
        style={{
          backgroundColor: item.read ? "#FFFFFF" : "#F8FAFC",
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 16,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: item.read ? 0.03 : 0.08,
          shadowRadius: 8,
          elevation: item.read ? 1 : 3,
          borderWidth: 1,
          borderColor: item.read ? "#F1F5F9" : "#E2E8F0",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View
            style={{
              minWidth: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: copy.bg,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: copy.color }}>{copy.chip}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: "#111827",
                lineHeight: 20,
                marginBottom: 4,
              }}
            >
              {copy.title}
            </Text>

            <Text style={{ fontSize: 14, color: "#4B5563", lineHeight: 20, marginBottom: 8 }}>
              {copy.body}
            </Text>

            {showAreaBadge ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: "#ECFDF5",
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#15803D" }}>In your Area</Text>
              </View>
            ) : null}

            <Text style={{ fontSize: 13, color: "#6B7280" }}>{formatTimeAgo(item.createdAt)}</Text>
          </View>

          {!item.read && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#3B82F6",
                marginLeft: 8,
                marginTop: 6,
              }}
            />
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center relative"
        activeOpacity={0.7}
      >
        <BellIcon size={24} color="#111827" />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
            <Text className="text-white text-xs font-bold">{unreadCount > 99 ? "99+" : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable className="flex-1 bg-black/50" onPress={() => setModalVisible(false)}>
          <Pressable
            className="flex-1 mt-20 overflow-hidden rounded-t-[32px] bg-white"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center pt-3">
              <View className="h-1.5 w-12 rounded-full bg-gray-200" />
            </View>

            <View className="px-6 py-5 border-b border-gray-100 flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread` : connected ? "Live updates on" : "Pull to refresh"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <TouchableOpacity
                  onPress={() => void markAllAsRead()}
                  disabled={unreadCount === 0}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: unreadCount === 0 ? "#F3F4F6" : "#ECFDF5",
                  }}
                >
                  <Text style={{ color: unreadCount === 0 ? "#9CA3AF" : "#15803D", fontWeight: "600" }}>
                    Read all
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center"
                >
                  <XMarkIcon size={20} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>

            {loading && notifications.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ color: "#6B7280", marginTop: 12 }}>Loading notifications...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View className="flex-1 items-center justify-center px-6">
                <View
                  style={{
                    backgroundColor: "#EEF2FF",
                    width: 96,
                    height: 96,
                    borderRadius: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  <BellAlertIcon size={42} color="#4F46E5" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8, textAlign: "center" }}>
                  No notifications yet
                </Text>
                <Text style={{ fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22 }}>
                  You&apos;ll be notified when clients accept or reject your offers and when they share contact details.
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
                refreshControl={
                  <RefreshControl refreshing={loading} onRefresh={refreshNotifications} colors={["#3B82F6"]} />
                }
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
