"use client"
import { View, Text, ScrollView, TouchableOpacity, Image, StatusBar, SafeAreaView, Modal } from "react-native"
import { useUser } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import WalletComponent from "@/components/WalletComponent"

const ProfileScreen = () => {
  const { user } = useUser()
  const [showVerificationModal, setShowVerificationModal] = useState(true)
  const [activeTab, setActiveTab] = useState("projects")

  const userProjects = [
    {
      id: 1,
      title: "E-commerce Website Development",
      client: "Sarah Johnson",
      status: "completed",
      completedDate: "2024-01-10",
      rating: 5,
      clientFeedback: "Excellent work! Delivered on time and exceeded expectations.",
      category: "Development",
      budget: "$2,500",
    },
    {
      id: 2,
      title: "Mobile App UI/UX Design",
      client: "TechStart Inc.",
      status: "completed",
      completedDate: "2023-12-15",
      rating: 4,
      clientFeedback: "Great design skills and very responsive to feedback.",
      category: "Design",
      budget: "$1,800",
    },
    {
      id: 3,
      title: "Content Writing for Health Blog",
      client: "Dr. Amanda Rodriguez",
      status: "in_progress",
      startDate: "2024-01-12",
      progress: 60,
      category: "Writing",
      budget: "$800",
    },
    {
      id: 4,
      title: "Social Media Marketing Campaign",
      client: "Fashion Forward",
      status: "completed",
      completedDate: "2023-11-20",
      rating: 5,
      clientFeedback: "Amazing results! Our engagement increased by 300%.",
      category: "Marketing",
      budget: "$1,200",
    },
    {
      id: 5,
      title: "Logo Design for Tech Startup",
      client: "Michael Chen",
      status: "in_progress",
      startDate: "2024-01-14",
      progress: 25,
      category: "Design",
      budget: "$600",
    },
  ]

  const completedProjects = userProjects.filter((project) => project.status === "completed")
  const inProgressProjects = userProjects.filter((project) => project.status === "in_progress")

  const averageRating =
    completedProjects.length > 0
      ? completedProjects.reduce((sum, project) => sum + (project.rating || 0), 0) / completedProjects.length
      : 0

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

  const renderProject = (project: any) => (
    <View key={project.id} className="bg-white rounded-2xl p-4 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}>
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-gray-900 flex-1 mr-2">{project.title}</Text>
        <View className={`px-2 py-1 rounded ${project.status === "completed" ? "bg-green-50" : "bg-blue-50"}`}>
          <Text
            className={`text-xs font-semibold ${project.status === "completed" ? "text-green-600" : "text-blue-600"}`}
          >
            {project.status === "completed" ? "COMPLETED" : "IN PROGRESS"}
          </Text>
        </View>
      </View>

      <Text className="text-gray-600 text-sm mb-2">Client: {project.client}</Text>

      {project.status === "completed" && (
        <View className="mb-3">
          <View className="flex-row items-center mb-1">
            <View className="flex-row mr-2">{renderStars(project.rating)}</View>
            <Text className="text-sm text-gray-600">({project.rating}/5)</Text>
          </View>
          <Text className="text-gray-500 text-sm italic">{project.clientFeedback}</Text>
          <Text className="text-gray-400 text-xs mt-1">Completed on {project.completedDate}</Text>
        </View>
      )}

      {project.status === "in_progress" && (
        <View className="mb-3">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-sm text-gray-600">Progress</Text>
            <Text className="text-sm font-semibold text-blue-600">{project.progress}%</Text>
          </View>
          <View className="w-full bg-gray-200 rounded-full h-2">
            <View className="bg-blue-500 h-2 rounded-full" style={{ width: `${project.progress}%` }} />
          </View>
          <Text className="text-gray-400 text-xs mt-1">Started on {project.startDate}</Text>
        </View>
      )}

      <View className="flex-row justify-between items-center">
        <View className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
          <Text className="text-gray-500 text-xs font-medium">{project.category}</Text>
        </View>
        <Text className="text-gray-700 font-semibold">{project.budget}</Text>
      </View>
    </View>
  )

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

  const renderProjects = () => (
    <View className="px-4 py-4">
      <Text className="text-xl font-bold text-gray-900 mb-4">My Projects</Text>

      {/* In Progress Projects */}
      {inProgressProjects.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Ionicons name="time-outline" size={20} color="#3B82F6" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">In Progress ({inProgressProjects.length})</Text>
          </View>
          {inProgressProjects.map(renderProject)}
        </View>
      )}

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <View>
          <View className="flex-row items-center mb-3">
            <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">Completed ({completedProjects.length})</Text>
          </View>
          {completedProjects.map(renderProject)}
        </View>
      )}

      {userProjects.length === 0 && (
        <View className="bg-white rounded-2xl p-8 items-center">
          <Ionicons name="briefcase-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 text-lg font-medium mt-4">No projects yet</Text>
          <Text className="text-gray-400 text-center mt-2">
            Start browsing available tasks to begin your freelancing journey!
          </Text>
        </View>
      )}
    </View>
  )

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
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">{userProjects.length}</Text>
              <Text className="text-gray-500 text-sm">Total Projects</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-green-600">{completedProjects.length}</Text>
              <Text className="text-gray-500 text-sm">Completed</Text>
            </View>
            <View className="items-center">
              <View className="flex-row items-center">
                <Text className="text-2xl font-bold text-yellow-500 mr-1">{averageRating.toFixed(1)}</Text>
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
              <Text className="text-gray-500 text-sm">Avg Rating</Text>
            </View>
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
