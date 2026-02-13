"use client"

import { NotificationBell } from "@/components/Notifications"
import { ApplicationModal } from "@/components/ApplicationModal"
import { fetchAPI } from "@/lib/fetch"
import { useUser } from "@clerk/clerk-expo"
import { router } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface Job {
  id: string
  title: string
  description: string
  budget: number
  category: string
  location: string
  createdAt: string
  clientName: string
  clientRating: number
  isMatch?: boolean
}

const Home = () => {
  const { user, isSignedIn } = useUser()

  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userSkills, setUserSkills] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
  const [applyingJobs, setApplyingJobs] = useState<Set<string>>(new Set())
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  useEffect(() => {
    if (isSignedIn === false) {
      router.replace("/")
    }
  }, [isSignedIn])

  const loadAppliedJobs = async () => {
    try {
      if (!user?.id) return
      
      // Load from AsyncStorage first for instant UI update
      const stored = await AsyncStorage.getItem(`appliedJobs_${user.id}`)
      if (stored) {
        const jobIds = JSON.parse(stored)
        setAppliedJobs(new Set(jobIds))
        console.log(`[Apply] Loaded ${jobIds.length} applied jobs from storage`)
      }
      
      // Then fetch from API to get latest state
      try {
        const token = await user.getIdToken()
        const response = await fetch(`https://quickhands-api.vercel.app/api/applications/my`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.data)) {
            const appliedJobIds = data.data.map((app: any) => String(app.jobId))
            setAppliedJobs(new Set(appliedJobIds))
            // Update storage
            await AsyncStorage.setItem(`appliedJobs_${user.id}`, JSON.stringify(appliedJobIds))
            console.log(`[Apply] Loaded ${appliedJobIds.length} applied jobs from API`)
          }
        }
      } catch (apiError) {
        console.warn('[Apply] Could not fetch applications from API:', apiError)
        // Continue with storage data if API fails
      }
    } catch (e) {
      console.error("Error loading applied jobs", e)
    }
  }

  const fetchUserSkills = async () => {
    try {
      if (!user?.id) return
      const response = await fetchAPI(`/api/user/get?clerkId=${user.id}`)
      if (response.user?.skills) {
        setUserSkills(response.user.skills)
        setSearchQuery(response.user.skills)
      }
    } catch (e) {
      console.error("Error fetching skills", e)
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch("https://quickhands-api.vercel.app/api/jobs")
      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        const mapped = data.data.map((job: any) => {
          const category = job.selectedServices?.join(", ") || job.serviceType || "General"

          return {
            id: String(job.id),
            title: job.serviceType || "Untitled Job",
            description: job.additionalInfo || "No description available",
            budget: Number.parseFloat(job.maxPrice) || 0,
            category,
            location: job.specialistChoice || "Remote",
            createdAt: job.startDate || new Date().toISOString(),
            clientName: "Anonymous Client",
            clientRating: 4.5,
            isMatch: userSkills && category.toLowerCase().includes(userSkills.toLowerCase()),
          }
        })

        setJobs(mapped)
      } else {
        setJobs([])
      }
    } catch (e) {
      console.error("Fetch jobs error", e)
      setJobs([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const searchJobs = async (query: string) => {
    if (!query.trim()) {
      fetchJobs()
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`https://quickhands-api.vercel.app/api/jobs/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        const mapped = data.data.map((job: any) => {
          const category = job.selectedServices?.join(", ") || job.serviceType || "General"

          return {
            id: String(job.id),
            title: job.serviceType || "Untitled Job",
            description: job.additionalInfo || "No description available",
            budget: Number.parseFloat(job.maxPrice) || 0,
            category,
            location: job.specialistChoice || "Remote",
            createdAt: job.startDate || new Date().toISOString(),
            clientName: "Anonymous Client",
            clientRating: 4.5,
            isMatch: userSkills && category.toLowerCase().includes(userSkills.toLowerCase()),
          }
        })
        setJobs(mapped)
      } else {
        fetchJobs()
      }
    } catch (e) {
      console.error("Search error", e)
      fetchJobs()
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadAppliedJobs()
      fetchUserSkills()
      fetchJobs()
    }
  }, [user])

  useEffect(() => {
    if (userSkills && jobs.length) {
      searchJobs(userSkills)
    }
  }, [userSkills])

  const handleApply = async (job: Job) => {
    if (!user?.id) {
      Alert.alert("Sign in required")
      return
    }

    if (appliedJobs.has(job.id)) return

    // Show modal for quotation and conditions
    setSelectedJob(job)
    setModalVisible(true)
  }

  const submitApplication = async (applicationData: { quotation: string; conditions: string }) => {
    if (!selectedJob || !user?.id) return

    setApplyingJobs((s) => new Set(s).add(selectedJob.id))

    try {
      const response = await fetch(`https://quickhands-api.vercel.app/api/jobs/${selectedJob.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          jobId: selectedJob.id,
          userName: user.firstName || "Freelancer",
          userEmail: user.primaryEmailAddress?.emailAddress,
          quotation: applicationData.quotation,
          conditions: applicationData.conditions,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error('Server error. Please contact support or try again later.')
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to apply")
      }

      // Add to applied jobs and save to storage
      setAppliedJobs((s) => {
        const updated = new Set(s).add(selectedJob.id)
        // Save to AsyncStorage
        AsyncStorage.setItem(`appliedJobs_${user.id}`, JSON.stringify(Array.from(updated)))
          .catch(err => console.warn('Failed to save to storage:', err))
        return updated
      })
      
      // Handle duplicate application message
      const message = data.alreadyApplied 
        ? "You've already applied to this job" 
        : "The client has been notified"
      
      Toast.show({
        type: "success",
        text1: data.alreadyApplied ? "Already applied" : "Applied successfully 🎉",
        text2: message,
        position: "bottom",
        visibilityTime: 3000,
        autoHide: true,
      })
    } catch (error) {
      console.error("Apply error:", error)
      Toast.show({
        type: "error",
        text1: "Application failed",
        text2: error instanceof Error ? error.message : "Please try again",
        position: "bottom",
        visibilityTime: 3000,
        autoHide: true,
      })
    } finally {
      setApplyingJobs((s) => {
        const next = new Set(s)
        next.delete(selectedJob.id)
        return next
      })
    }
  }

  const timeAgo = (date: string) => {
    const diff = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60)
    if (diff > 24) return `${Math.floor(diff / 24)}d ago`
    if (diff > 1) return `${Math.floor(diff)}h ago`
    return "Just now"
  }

  const renderJobCard = ({ item }: { item: Job }) => (
    <View className="bg-white rounded-3xl p-6 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 }}>
      {/* Header with user info */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
            <Text className="text-lg font-bold text-gray-600">{item.clientName.charAt(0)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900">{item.clientName}</Text>
            <Text className="text-xs text-gray-500">Posted {timeAgo(item.createdAt)}</Text>
          </View>
        </View>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
          <Text className="text-lg">🤍</Text>
        </TouchableOpacity>
      </View>

      {/* Job title */}
      <Text className="text-xl font-bold text-gray-900 mb-2 leading-7">{item.title}</Text>

      {/* Description */}
      <Text className="text-sm text-gray-600 mb-4 leading-5" numberOfLines={2}>
        {item.description}
      </Text>

      {/* Tags */}
      <View className="flex-row flex-wrap gap-2 mb-5">
        {item.category
          .split(",")
          .slice(0, 4)
          .map((tag, i) => (
            <View key={i} className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100">
              <Text className="text-xs font-semibold text-indigo-700">{tag.trim()}</Text>
            </View>
          ))}
      </View>

      {/* Budget */}
      <View className="border-t border-gray-100 pt-4 mb-4">
        <Text className="text-3xl font-bold text-gray-900 mb-1">${item.budget}/h</Text>
        <Text className="text-sm text-gray-500">Hourly rate • {item.location}</Text>
      </View>

      {/* Apply button */}
      <TouchableOpacity
        onPress={() => handleApply(item)}
        disabled={appliedJobs.has(item.id) || applyingJobs.has(item.id)}
        activeOpacity={0.85}
        className={`w-full py-4 rounded-2xl items-center justify-center ${
          appliedJobs.has(item.id) ? "bg-green-500" : "bg-blue-600"
        }`}
        style={{ shadowColor: appliedJobs.has(item.id) ? "#10B981" : "#2563EB", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 }}
      >
        {applyingJobs.has(item.id) ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View className="flex-row items-center">
            <Text className="text-white text-base font-bold mr-2">
              {appliedJobs.has(item.id) ? "✓ Applied" : "⚡ Apply"}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )

  const StatsCard = () => (
    <View className="bg-gray-900 rounded-3xl p-6 mb-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 12 }}>
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-xl font-bold">Stats</Text>
        <View className="bg-gray-800 px-4 py-2 rounded-xl">
          <Text className="text-white text-sm">All Time ▾</Text>
        </View>
      </View>

      {/* Earnings */}
      <Text className="text-gray-400 text-sm mb-2">Earnings</Text>
      <Text className="text-white text-5xl font-bold mb-1">
        $9,787<Text className="text-gray-600">.32</Text>
      </Text>
      <Text className="text-green-500 text-sm font-semibold mb-6">+$2,456.12 since last month</Text>

      {/* Projects and Clients */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-gray-800 rounded-2xl p-4">
          <Text className="text-white text-3xl font-bold mb-1">36</Text>
          <Text className="text-gray-400 text-sm">projects</Text>
          <Text className="text-gray-500 text-xs mt-1">5 this month</Text>
        </View>
        <View className="flex-1 bg-gray-800 rounded-2xl p-4">
          <Text className="text-white text-3xl font-bold mb-1">10</Text>
          <Text className="text-gray-400 text-sm">clients</Text>
          <Text className="text-gray-500 text-xs mt-1">3 this month</Text>
        </View>
      </View>

      {/* Achievement badge */}
      <View className="bg-white rounded-2xl p-4 mb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-900 text-2xl font-bold">5th place</Text>
            <Text className="text-gray-600 text-sm">top-hire freelances</Text>
          </View>
          <Text className="text-4xl">🏆</Text>
        </View>
      </View>

      {/* Availability */}
      <Text className="text-white text-base font-semibold mb-3">Availability</Text>
      <View className="flex-row gap-1 mb-2">
        {[...Array(30)].map((_, i) => {
          const colors = [
            "bg-blue-500",
            "bg-blue-600",
            "bg-indigo-500",
            "bg-indigo-600",
            "bg-purple-500",
            "bg-purple-600",
            "bg-pink-500",
            "bg-pink-600",
            "bg-rose-500",
            "bg-orange-500",
            "bg-gray-700",
            "bg-gray-800",
          ]
          const colorIndex = Math.floor((i / 30) * colors.length)
          return <View key={i} className={`flex-1 h-12 rounded ${colors[colorIndex]}`} />
        })}
      </View>
      <Text className="text-gray-400 text-sm">100h/month</Text>
    </View>
  )

  const CTACard = () => (
    <View className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 mb-4 border-2 border-purple-100" style={{ shadowColor: "#A855F7", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 }}>
      <View className="items-center mb-4">
        <Text className="text-6xl mb-4">🔗</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">Get new clients 2x faster</Text>
        <Text className="text-sm text-gray-600 text-center px-4">
          Join us today and unlock opportunities to land new clients twice as fast!
        </Text>
      </View>
      <TouchableOpacity className="bg-gray-900 py-4 rounded-2xl items-center" activeOpacity={0.85} style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 }}>
        <Text className="text-white text-base font-bold">Join now</Text>
      </TouchableOpacity>
    </View>
  )

  const IncomeCard = () => (
    <View className="bg-white rounded-3xl p-6" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 }}>
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-gray-900 text-xl font-bold">Income</Text>
        <View className="bg-gray-100 px-4 py-2 rounded-xl">
          <Text className="text-gray-900 text-sm">Monthly ▾</Text>
        </View>
      </View>

      {/* April */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 mb-1">$2,167.56</Text>
        <Text className="text-gray-500 text-sm mb-3">April</Text>
        <View className="flex-row gap-1">
          <View className="bg-blue-500 h-2 rounded-full" style={{ width: "30%" }} />
          <View className="bg-pink-400 h-2 rounded-full" style={{ width: "25%" }} />
          <View className="bg-yellow-400 h-2 rounded-full" style={{ width: "20%" }} />
          <View className="bg-orange-500 h-2 rounded-full" style={{ width: "15%" }} />
        </View>
      </View>

      {/* March */}
      <View>
        <Text className="text-2xl font-bold text-gray-900 mb-1">$1,367.50</Text>
        <Text className="text-gray-500 text-sm mb-3">March</Text>
        <View className="flex-row gap-1">
          <View className="bg-blue-500 h-2 rounded-full" style={{ width: "20%" }} />
          <View className="bg-pink-400 h-2 rounded-full" style={{ width: "40%" }} />
          <View className="bg-yellow-400 h-2 rounded-full" style={{ width: "30%" }} />
          <View className="bg-orange-500 h-2 rounded-full" style={{ width: "5%" }} />
        </View>
      </View>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="text-gray-500 text-sm mt-4 font-semibold">Loading jobs...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchJobs} />}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-gray-500 text-sm">Welcome back,</Text>
              <Text className="text-3xl font-bold text-gray-900">{user?.firstName || "Freelancer"}</Text>
            </View>
            {user?.id && <NotificationBell userId={user.id} />}
          </View>

          {/* Search */}
          <View className="bg-white rounded-2xl px-5 py-4 flex-row items-center" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
            <Text className="text-gray-400 mr-3 text-lg">🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t)
                searchJobs(t)
              }}
              placeholder="Search jobs or skills..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-base text-gray-900"
            />
            {isSearching && <ActivityIndicator size="small" color="#4F46E5" />}
          </View>
        </View>

        {/* Dashboard Grid */}
        <View className="px-6 pb-8">
          {/* Jobs List */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">Available Jobs</Text>
            {jobs.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 items-center">
                <Text className="text-4xl mb-3">💼</Text>
                <Text className="text-gray-500 text-center">No jobs found. Try adjusting your search.</Text>
              </View>
            ) : (
              jobs.map((job) => <View key={job.id}>{renderJobCard({ item: job })}</View>)
            )}
          </View>

          {/* Stats Card */}
          <StatsCard />

          {/* CTA Card */}
          <CTACard />

          {/* Income Card */}
          <IncomeCard />
        </View>
      </ScrollView>

      {/* Application Modal */}
      {selectedJob && (
        <ApplicationModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={submitApplication}
          jobTitle={selectedJob.title}
          jobBudget={selectedJob.budget}
        />
      )}
    </SafeAreaView>
  )
}

export default Home
