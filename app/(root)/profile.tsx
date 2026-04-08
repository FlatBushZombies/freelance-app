"use client"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from "react-native"
import { useUser, useAuth } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import WalletComponent from "@/components/WalletComponent"
import { getApiUrl } from "@/lib/fetch"

const ProfileScreen = () => {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [activeTab, setActiveTab] = useState("projects")
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.id) return

      try {
        const token = await getToken()
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch(getApiUrl("/api/applications/my"), {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          const projects = data.data.map((app: any) => ({
            id: app.id,
            title: app.jobServiceType || "Untitled Job",
            client: app.jobOwnerName || "Client",
            status:
              app.status === "accepted"
                ? "in_progress"
                : app.status === "rejected"
                ? "rejected"
                : "pending",
            startDate: app.createdAt,
            quotation: app.quotation || "Not specified",
            conditions: app.conditions || "",
            category: app.jobServiceType || "General",
            budget: app.quotation || "N/A",
          }))
          setUserProjects(projects)
        }
      } catch (error) {
        console.error("Error fetching applications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [getToken, user?.id])

  const acceptedProjects = userProjects.filter((p) => p.status === "in_progress")
  const pendingProjects  = userProjects.filter((p) => p.status === "pending")
  const rejectedProjects = userProjects.filter((p) => p.status === "rejected")
  const completedProjects = userProjects.filter((p) => p.status === "completed")

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? "star" : "star-outline"}
        size={14}
        color={i < rating ? "#F59E0B" : "#D1D5DB"}
      />
    ))

  // Dynamic status colours cannot be expressed as static Tailwind classes,
  // so we keep them as plain values and apply via `style` only on the coloured elements.
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "in_progress":
        return { bg: "#F0F7EC", text: "#3B6D11", label: "Accepted",  dot: "#639922"  }
      case "pending":
        return { bg: "#FEF9EC", text: "#854F0B", label: "Pending",   dot: "#BA7517"  }
      case "rejected":
        return { bg: "#FDF1F1", text: "#A32D2D", label: "Rejected",  dot: "#E24B4A"  }
      case "completed":
        return { bg: "#EDF4FD", text: "#0C447C", label: "Completed", dot: "#378ADD"  }
      default:
        return { bg: "#F5F5F4", text: "#5F5E5A", label: "Unknown",   dot: "#888780"  }
    }
  }

  const renderProject = (project: any) => {
    const config = getStatusConfig(project.status)

    return (
      <View
        key={project.id}
        className="bg-white rounded-xl p-4 mb-2.5"
        style={{ borderWidth: 0.5, borderColor: "#E5E7EB" }}
      >
        {/* Header row */}
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="text-sm font-medium text-gray-900 flex-1 mr-2.5" numberOfLines={2}>
            {project.title}
          </Text>
          {/* Badge — bg & text colour are dynamic, structure is NativeWind */}
          <View
            className="flex-row items-center px-2 py-0.5 rounded-md"
            style={{ backgroundColor: config.bg }}
          >
            <View
              className="w-1.5 h-1.5 rounded-full mr-1.5"
              style={{ backgroundColor: config.dot }}
            />
            <Text className="text-xs font-medium" style={{ color: config.text }}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Client + category */}
        <Text className="text-xs text-gray-500 mb-3">
          {project.client} · {project.category}
        </Text>

        {/* Quotation — left border accent, no filled box */}
        {project.quotation && (
          <View
            className="pl-2.5 mb-2.5"
            style={{ borderLeftWidth: 2, borderLeftColor: "#639922" }}
          >
            <Text
              className="text-[10px] font-medium uppercase mb-0.5"
              style={{ color: "#639922", letterSpacing: 0.4 }}
            >
              Quotation
            </Text>
            <Text className="text-[13px] font-medium text-gray-900">
              {project.quotation}
            </Text>
          </View>
        )}

        {/* Conditions — plain inline text, no filled box */}
        {project.conditions ? (
          <Text className="text-xs text-gray-500 mb-3 leading-[18px]">
            Terms: {project.conditions}
          </Text>
        ) : null}

        {/* Footer */}
        <View
          className="flex-row justify-between items-center pt-2.5"
          style={{ borderTopWidth: 0.5, borderTopColor: "#F3F4F6" }}
        >
          <Text className="text-[11px] text-gray-400">
            Applied{" "}
            {new Date(project.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
          <Text className="text-[13px] font-medium text-gray-900">{project.budget}</Text>
        </View>
      </View>
    )
  }

  const renderPersonalInfo = () => (
    <View className="px-4 pt-5">

      {/* Full name */}
      <View
        className="bg-white rounded-xl p-4 mb-2.5"
        style={{ borderWidth: 0.5, borderColor: "#E5E7EB" }}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text
              className="text-[11px] font-medium text-gray-400 uppercase mb-1.5"
              style={{ letterSpacing: 0.5 }}
            >
              Full name
            </Text>
            <Text className="text-sm font-medium text-gray-900">
              {user?.fullName || "Please fill in your name"}
            </Text>
          </View>
          <TouchableOpacity className="p-1">
            <Ionicons name="pencil" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* About you */}
      <View
        className="bg-white rounded-xl p-4 mb-2.5"
        style={{ borderWidth: 0.5, borderColor: "#E5E7EB" }}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text
              className="text-[11px] font-medium text-gray-400 uppercase mb-1.5"
              style={{ letterSpacing: 0.5 }}
            >
              About you
            </Text>
            <Text className="text-[13px] text-gray-500 leading-5">
              Write important information that clients might need to know
            </Text>
          </View>
          <TouchableOpacity className="p-1">
            <Ionicons name="pencil" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Education and experience */}
      <View
        className="bg-white rounded-xl p-4 mb-2.5"
        style={{ borderWidth: 0.5, borderColor: "#E5E7EB" }}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text
              className="text-[11px] font-medium text-gray-400 uppercase mb-1.5"
              style={{ letterSpacing: 0.5 }}
            >
              Education and experience
            </Text>
            <Text className="text-[13px] text-gray-500 leading-5">
              Add the education you have and past work experience
            </Text>
          </View>
          <TouchableOpacity className="p-1">
            <Ionicons name="add" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Address and region */}
      <View
        className="bg-white rounded-xl p-4 mb-2.5"
        style={{ borderWidth: 0.5, borderColor: "#E5E7EB" }}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text
              className="text-[11px] font-medium text-gray-400 uppercase mb-1.5"
              style={{ letterSpacing: 0.5 }}
            >
              Address and region
            </Text>
            <Text className="text-[13px] text-gray-500 leading-5">
              We do not share your address with clients, it is needed to show you jobs near you
            </Text>
          </View>
          <TouchableOpacity className="p-1">
            <Ionicons name="add" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

    </View>
  )

  const renderProjects = () => {
    if (loading) {
      return (
        <View className="py-12 items-center">
          <ActivityIndicator size="large" color="#111827" />
          <Text className="text-gray-400 mt-3.5 text-[13px]">
            Loading your applications...
          </Text>
        </View>
      )
    }

    return (
      <View className="px-4 pt-5">

        {/* Section label */}
        <Text
          className="text-[11px] font-medium text-gray-400 uppercase mb-4"
          style={{ letterSpacing: 0.6 }}
        >
          My applications
        </Text>

        {/* Accepted */}
        {acceptedProjects.length > 0 && (
          <View className="mb-5">
            <View className="flex-row items-center mb-2.5">
              <View className="w-1.5 h-1.5 rounded-full bg-green-700 mr-2" />
              <Text className="text-[13px] font-medium text-gray-900">
                Accepted · {acceptedProjects.length}
              </Text>
            </View>
            {acceptedProjects.map(renderProject)}
          </View>
        )}

        {/* Pending */}
        {pendingProjects.length > 0 && (
          <View className="mb-5">
            <View className="flex-row items-center mb-2.5">
              <View className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-2" />
              <Text className="text-[13px] font-medium text-gray-900">
                Pending · {pendingProjects.length}
              </Text>
            </View>
            {pendingProjects.map(renderProject)}
          </View>
        )}

        {/* Rejected */}
        {rejectedProjects.length > 0 && (
          <View className="mb-5">
            <View className="flex-row items-center mb-2.5">
              <View className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2" />
              <Text className="text-[13px] font-medium text-gray-900">
                Rejected · {rejectedProjects.length}
              </Text>
            </View>
            {rejectedProjects.map(renderProject)}
          </View>
        )}

        {/* Completed */}
        {completedProjects.length > 0 && (
          <View className="mb-5">
            <View className="flex-row items-center mb-2.5">
              <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
              <Text className="text-[13px] font-medium text-gray-900">
                Completed · {completedProjects.length}
              </Text>
            </View>
            {completedProjects.map(renderProject)}
          </View>
        )}

        {/* Empty state */}
        {userProjects.length === 0 && (
          <View
            className="bg-white rounded-xl p-10 items-center"
            style={{ borderWidth: 0.5, borderColor: "#E5E7EB" }}
          >
            <Ionicons name="briefcase-outline" size={36} color="#D1D5DB" />
            <Text className="text-gray-700 text-sm font-medium mt-4">
              No applications yet
            </Text>
            <Text className="text-gray-400 text-[13px] text-center mt-1.5 leading-5">
              Start browsing available tasks to begin your freelancing journey!
            </Text>
          </View>
        )}

      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <TouchableOpacity
              className="absolute top-4 right-4 z-10 p-1"
              onPress={() => setShowVerificationModal(false)}
            >
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-base font-medium text-gray-900 mb-2.5 text-center">
                Verify your account
              </Text>
              <Text className="text-[13px] text-gray-500 text-center mb-6 leading-5">
                Clients choose specialists with a verified ID/Passport.{"\n"}It only takes a minute.
              </Text>

              <TouchableOpacity
                className="bg-gray-900 rounded-[10px] px-6 py-3.5 w-full"
                activeOpacity={0.85}
                onPress={() => setShowVerificationModal(false)}
              >
                <Text className="text-white font-medium text-center text-sm">
                  Verify your account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View
          className="bg-white mx-4 mt-4 rounded-2xl p-6"
          style={{ borderWidth: 0.5, borderColor: "#E5E7EB" }}
        >
          <View className="items-center mb-5">
            <Image
              source={{ uri: user?.imageUrl || "/diverse-user-avatars.png" }}
              className="rounded-full mb-3"
              style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 0.5, borderColor: "#E5E7EB" }}
            />
            <Text className="text-lg font-semibold text-gray-900 mb-0.5">
              {user?.fullName || "User"}
            </Text>
            <Text className="text-[13px] text-gray-400">
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>

          {/* Stats — contained metric tiles */}
          <View
            className="flex-row gap-2 pt-4"
            style={{ borderTopWidth: 0.5, borderTopColor: "#F3F4F6" }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <>
                <View className="flex-1 bg-gray-50 rounded-[10px] p-3 items-center">
                  <Text className="text-xl font-medium text-gray-900">{userProjects.length}</Text>
                  <Text className="text-[11px] text-gray-400 mt-0.5">Applications</Text>
                </View>
                <View className="flex-1 bg-gray-50 rounded-[10px] p-3 items-center">
                  <Text className="text-xl font-medium text-gray-900">{acceptedProjects.length}</Text>
                  <Text className="text-[11px] text-gray-400 mt-0.5">Accepted</Text>
                </View>
                <View className="flex-1 bg-gray-50 rounded-[10px] p-3 items-center">
                  <Text className="text-xl font-medium text-gray-900">{pendingProjects.length}</Text>
                  <Text className="text-[11px] text-gray-400 mt-0.5">Pending</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Tab navigation — flat, no elevation */}
        <View
          className="mx-4 mt-4 flex-row"
          style={{ borderBottomWidth: 0.5, borderBottomColor: "#E5E7EB" }}
        >
          {[
            { key: "projects", label: "Projects" },
            { key: "personal", label: "Personal info" },
            { key: "wallet",   label: "Wallet" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className="flex-1 py-3 items-center"
              style={{
                borderBottomWidth: activeTab === tab.key ? 1.5 : 0,
                borderBottomColor: activeTab === tab.key ? "#111827" : "transparent",
                marginBottom: -0.5,
              }}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                className="text-[13px]"
                style={{
                  fontWeight: activeTab === tab.key ? "500" : "400",
                  color: activeTab === tab.key ? "#111827" : "#9CA3AF",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === "projects" ? (
          renderProjects()
        ) : activeTab === "personal" ? (
          renderPersonalInfo()
        ) : (
          <WalletComponent />
        )}

        {/* Bottom padding */}
        <View className="h-8" />

      </ScrollView>
    </SafeAreaView>
  )
}

export default ProfileScreen