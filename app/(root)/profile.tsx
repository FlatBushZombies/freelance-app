"use client"
import { View, Text, ScrollView, TouchableOpacity, Image, StatusBar, SafeAreaView, Modal, ActivityIndicator } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import WalletComponent from "@/components/WalletComponent"

const ProfileScreen = () => {
  const { user } = useUser()
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [activeTab, setActiveTab] = useState("projects")
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.id) return

      try {
        const token = await (user as any).getIdToken?.()
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch(
          'https://quickhands-api.vercel.app/api/applications/my',
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        )
        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          // Transform applications into project format
          const projects = data.data.map((app: any) => ({
            id: app.id,
            title: app.jobServiceType || "Untitled Job",
            client: app.jobOwnerName || "Client",
            status: app.status === 'accepted' ? 'in_progress' : app.status === 'rejected' ? 'rejected' : 'pending',
            startDate: app.createdAt,
            quotation: app.quotation || 'Not specified',
            conditions: app.conditions || '',
            category: app.jobServiceType || 'General',
            budget: app.quotation || 'N/A',
          }))
          setUserProjects(projects)
        }
      } catch (error) {
        console.error('Error fetching applications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [user?.id])

  const acceptedProjects = userProjects.filter((project) => project.status === "in_progress")
  const pendingProjects = userProjects.filter((project) => project.status === "pending")
  const rejectedProjects = userProjects.filter((project) => project.status === "rejected")
  const completedProjects = userProjects.filter((project) => project.status === "completed")

  const averageRating = 0 // Ratings not implemented yet

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color={index < rating ? "#F59E0B" : "#D1D5DB"}
      />
    ))
  }

  const renderProject = (project: any) => {
    const getStatusStyle = (status: string) => {
      switch (status) {
        case 'in_progress':
          return { bg: 'bg-green-50', text: 'text-green-600', label: 'ACCEPTED' }
        case 'pending':
          return { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'PENDING' }
        case 'rejected':
          return { bg: 'bg-red-50', text: 'text-red-600', label: 'REJECTED' }
        case 'completed':
          return { bg: 'bg-blue-50', text: 'text-blue-600', label: 'COMPLETED' }
        default:
          return { bg: 'bg-gray-50', text: 'text-gray-600', label: 'UNKNOWN' }
      }
    }
    
    const statusStyle = getStatusStyle(project.status)
    
    return (
      <View key={project.id} className="bg-white rounded-2xl p-4 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-lg font-semibold text-gray-900 flex-1 mr-2">{project.title}</Text>
          <View className={`px-2 py-1 rounded ${statusStyle.bg}`}>
            <Text className={`text-xs font-semibold ${statusStyle.text}`}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <Text className="text-gray-600 text-sm mb-2">Client: {project.client}</Text>

      {project.quotation && (
        <View className="bg-green-50 rounded-lg p-3 mb-2">
          <Text className="text-green-800 font-semibold text-sm">Your Quotation: {project.quotation}</Text>
        </View>
      )}

      {project.conditions && (
        <View className="bg-blue-50 rounded-lg p-3 mb-2">
          <Text className="text-blue-800 text-sm">Terms: {project.conditions}</Text>
        </View>
      )}

      <Text className="text-gray-400 text-xs mt-1">
        Applied: {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </Text>

      <View className="flex-row justify-between items-center">
        <View className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
          <Text className="text-gray-500 text-xs font-medium">{project.category}</Text>
        </View>
        <Text className="text-gray-700 font-semibold">{project.budget}</Text>
      </View>
    </View>
  )}

  const renderPersonalInfo = () => (
    <View className="px-4 py-4">
      {/* Name Section */}
      <View className="bg-white rounded-2xl p-4 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
        <View className="flex-row justify-between items-center border-b border-gray-100 pb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-1">Please fill in your name</Text>
            <Text className="text-gray-600">{user?.fullName || "Not provided"}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="pencil" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* About You Section */}
      <View className="bg-white rounded-2xl p-4 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
        <View className="flex-row justify-between items-start border-b border-gray-100 pb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-2">About you</Text>
            <Text className="text-gray-500 text-sm leading-5">
              Write important information that clients might need to know
            </Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="pencil" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Education and Experience Section */}
      <View className="bg-white rounded-2xl p-4 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
        <View className="flex-row justify-between items-start border-b border-gray-100 pb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Education and Experience</Text>
            <Text className="text-gray-500 text-sm leading-5">Add the education you have and past work experience</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="add" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Address and Region Section */}
      <View className="bg-white rounded-2xl p-4 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
        <View className="flex-row justify-between items-start border-b border-gray-100 pb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Address and Region</Text>
            <Text className="text-gray-500 text-sm leading-5">
              We do not share your address with clients, it is needed to show you jobs near you
            </Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="add" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderProjects = () => {
    if (loading) {
      return (
        <View className="px-4 py-8 items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">Loading your applications...</Text>
        </View>
      )
    }

    return (
      <View className="px-4 py-4">
        <Text className="text-xl font-bold text-gray-900 mb-4">My Applications</Text>

        {/* Accepted Projects */}
        {acceptedProjects.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Accepted ({acceptedProjects.length})</Text>
            </View>
            {acceptedProjects.map(renderProject)}
          </View>
        )}

        {/* Pending Applications */}
        {pendingProjects.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Pending ({pendingProjects.length})</Text>
            </View>
            {pendingProjects.map(renderProject)}
          </View>
        )}

        {/* Rejected Applications */}
        {rejectedProjects.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="close-circle" size={20} color="#EF4444" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Rejected ({rejectedProjects.length})</Text>
            </View>
            {rejectedProjects.map(renderProject)}
          </View>
        )}

        {/* Completed Projects */}
        {completedProjects.length > 0 && (
          <View>
            <View className="flex-row items-center mb-3">
              <Ionicons name="trophy" size={20} color="#3B82F6" />
              <Text className="text-lg font-semibold text-gray-900 ml-2">Completed ({completedProjects.length})</Text>
            </View>
            {completedProjects.map(renderProject)}
          </View>
        )}

        {userProjects.length === 0 && (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Ionicons name="briefcase-outline" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg font-medium mt-4">No applications yet</Text>
            <Text className="text-gray-400 text-center mt-2">
              Start browsing available tasks to begin your freelancing journey!
            </Text>
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <TouchableOpacity className="absolute top-4 right-4 z-10" onPress={() => setShowVerificationModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>

            <View className="items-center">
              <Text className="text-xl font-bold text-gray-900 mb-3 text-center">Verify your account</Text>
              <Text className="text-gray-600 text-center mb-6 leading-5">
                Clients choose specialists with a verified ID/Passport.{"\n"}It only takes a minute.
              </Text>

              <TouchableOpacity
                className="bg-gray-900 rounded-lg px-6 py-3 w-full"
                activeOpacity={0.85}
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 }}
                onPress={() => {
                  // Handle verification process
                  setShowVerificationModal(false)
                }}
              >
                <Text className="text-white font-semibold text-center">Verify your account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-6" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 }}>
          <View className="items-center mb-4">
            <Image
              source={{ uri: user?.imageUrl || "/diverse-user-avatars.png" }}
              className="w-24 h-24 rounded-full mb-3"
            />
            <Text className="text-2xl font-bold text-gray-900">{user?.fullName || "User"}</Text>
            <Text className="text-gray-500 text-base">{user?.primaryEmailAddress?.emailAddress}</Text>
          </View>

          {/* Stats */}
          <View className="flex-row justify-around border-t border-gray-100 pt-4">
            {loading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-gray-900">{userProjects.length}</Text>
                  <Text className="text-gray-500 text-sm">Applications</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-green-600">{acceptedProjects.length}</Text>
                  <Text className="text-gray-500 text-sm">Accepted</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-yellow-500">{pendingProjects.length}</Text>
                  <Text className="text-gray-500 text-sm">Pending</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Horizontal Tab Navigation */}
        <View className="mx-4 mt-4 bg-white rounded-2xl" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
          <View className="flex-row">
            <TouchableOpacity
              className={`flex-1 py-4 items-center border-b-2 ${
                activeTab === "projects" ? "border-blue-500" : "border-transparent"
              }`}
              onPress={() => setActiveTab("projects")}
            >
              <Text className={`font-semibold ${activeTab === "projects" ? "text-blue-500" : "text-gray-500"}`}>
                Projects
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-4 items-center border-b-2 ${
                activeTab === "personal" ? "border-blue-500" : "border-transparent"
              }`}
              onPress={() => setActiveTab("personal")}
            >
              <Text className={`font-semibold ${activeTab === "personal" ? "text-blue-500" : "text-gray-500"}`}>
                Personal info
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-4 items-center border-b-2 ${
                activeTab === "wallet" ? "border-blue-500" : "border-transparent"
              }`}
              onPress={() => setActiveTab("wallet")}
            >
              <Text className={`font-semibold ${activeTab === "wallet" ? "text-blue-500" : "text-gray-500"}`}>
                Wallet
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conditional Content Rendering Based on Active Tab */}
        {activeTab === "projects" ? (
          renderProjects()
        ) : activeTab === "personal" ? (
          renderPersonalInfo()
        ) : (
          <WalletComponent />
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default ProfileScreen
