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
import { io, type Socket } from "socket.io-client"

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
  const [socket, setSocket] = useState<Socket | null>(null)


  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`https://quickhands-api.vercel.app/api/notifications/by-clerk/${userId}`)
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
  }, [userId])

  
  useEffect(() => {
    const newSocket = io("https://quickhands-api.vercel.app", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    newSocket.on("connect", () => {
      console.log("[v0] Socket connected:", newSocket.id)
      newSocket.emit("join", userId)
    })

    newSocket.on("reconnect", () => {
      console.log("[v0] Socket reconnected:", newSocket.id)
      newSocket.emit("join", userId)
    })

    newSocket.on("disconnect", () => {
      console.log("[v0] Socket disconnected")
    })

    // ✅ Handle new notifications (avoid duplicates)
    newSocket.on("newNotification", (notification: Notification) => {
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === notification.id)
        if (exists) return prev
        return [notification, ...prev]
      })
      if (!notification.read) setUnreadCount((prev) => prev + 1)
    })

    newSocket.on("notificationRead", (notificationId: number) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    })

    setSocket(newSocket)

    return () => {
      newSocket.off("newNotification")
      newSocket.off("notificationRead")
      newSocket.disconnect()
    }
  }, [userId])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // ✅ Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`https://quickhands-api.vercel.app/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
        socket?.emit("markAsRead", notificationId)
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

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => markAsRead(item.id)}
      className={`p-4 border-b border-gray-100 ${!item.read ? "bg-blue-50" : "bg-white"}`}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className={`text-sm leading-relaxed ${!item.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
            {item.message}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">{formatTimeAgo(item.createdAt)}</Text>
        </View>
        {!item.read && <View className="w-2 h-2 rounded-full bg-blue-500 mt-1" />}
      </View>
    </TouchableOpacity>
  )

  return (
    <>
      {/* 🔔 Bell Icon */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center relative"
        activeOpacity={0.7}
      >
        <Text className="text-xl">🔔</Text>
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
                <ActivityIndicator size="large" color="#111827" />
              </View>
            ) : notifications.length === 0 ? (
              <View className="flex-1 items-center justify-center px-6">
                <Text className="text-6xl mb-4">🔔</Text>
                <Text className="text-gray-900 text-lg font-semibold mb-2">No notifications yet</Text>
                <Text className="text-gray-500 text-center">You’ll see notifications here when you receive them</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={loading} onRefresh={fetchNotifications} />
                }
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
