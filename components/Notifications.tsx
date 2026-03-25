"use client"
import { useEffect, useState, useCallback } from "react"
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  ActivityIndicator, 
  Pressable, 
  RefreshControl 
} from "react-native"
import { BellIcon } from "react-native-heroicons/outline"
import { useAuth } from "@clerk/clerk-expo"

interface Notification {
  id: number
  userId: number
  jobId: number
  message: string
  read: boolean
  createdAt: string
}

interface NotificationBellProps {
  userId: string
}

export const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()


  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(
        `https://quickhands-api.vercel.app/api/notifications/by-clerk/${userId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )
      const data = await response.json()

      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications)
        const unread = data.notifications.filter((n: Notification) => !n.read).length
        setUnreadCount(unread)
      } else {
        console.log("[v0] Unexpected response:", data)
      }
    } catch (error) {
      console.error("[v0] Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [userId, getToken])

  
  // Poll for notifications every 10 seconds
  useEffect(() => {
    if (!userId) return

    // Initial fetch
    fetchNotifications()

    // Set up polling interval
    const interval = setInterval(() => {
      fetchNotifications()
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [userId, fetchNotifications])


  // ✅ Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const token = await getToken()
      const response = await fetch(`https://quickhands-api.vercel.app/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("[v0] Error marking notification as read:", error)
    }
  }

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

  const getNotificationIcon = (message: string) => {
    if (message.includes("accepted")) return { icon: "✅", color: "#10B981", bg: "#D1FAE5" }
    if (message.includes("rejected")) return { icon: "❌", color: "#EF4444", bg: "#FEE2E2" }
    if (message.includes("New job")) return { icon: "💼", color: "#3B82F6", bg: "#DBEAFE" }
    return { icon: "🔔", color: "#6366F1", bg: "#E0E7FF" }
  }

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconData = getNotificationIcon(item.message)
    
    return (
      <TouchableOpacity
        onPress={() => markAsRead(item.id)}
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
          {/* Icon */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: iconData.bg,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 24 }}>{iconData.icon}</Text>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: item.read ? "400" : "600",
                color: "#111827",
                lineHeight: 21,
                marginBottom: 6,
              }}
            >
              {item.message}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: "#6B7280" }}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>

          {/* Unread indicator */}
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
      {/* 🔔 Bell Icon */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center relative"
        activeOpacity={0.7}
      >
        <Text className="text-xl">
          <BellIcon size={24} color="#111827" />
        </Text>
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
            <Text className="text-white text-xs font-bold">{unreadCount > 99 ? "99+" : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* 🪟 Notifications Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable className="flex-1 bg-black/50" onPress={() => setModalVisible(false)}>
          <Pressable className="flex-1 mt-20 bg-white rounded-t-3xl" onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View className="px-6 py-5 border-b border-gray-100 flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
                {unreadCount > 0 && <Text className="text-sm text-gray-500 mt-1">{unreadCount} unread</Text>}
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <Text className="text-gray-600 text-lg">✕</Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ color: "#6B7280", marginTop: 12 }}>Loading notifications...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View className="flex-1 items-center justify-center px-6">
                <View style={{
                  backgroundColor: "#F3F4F6",
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}>
                  <Text style={{ fontSize: 56 }}>🔔</Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8, textAlign: "center" }}>
                  No notifications yet
                </Text>
                <Text style={{ fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22 }}>
                  You&apos;ll be notified when clients{"\n"}respond to your applications
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
                  <RefreshControl refreshing={loading} onRefresh={fetchNotifications} colors={["#3B82F6"]} />
                }
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
