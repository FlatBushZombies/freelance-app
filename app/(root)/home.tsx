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
        text1: data.alreadyApplied ? "Already applied" : "Applied successfully",
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

  /* ─────────────────── Job Card ─────────────────── */
  const renderJobCard = ({ item }: { item: Job }) => {
    const isApplied = appliedJobs.has(item.id)
    const isApplying = applyingJobs.has(item.id)
    const tags = item.category.split(",").slice(0, 3)

    return (
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          padding: 20,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: item.isMatch ? "#D1FAE5" : "#F3F4F6",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        {/* Match badge */}
        {item.isMatch && (
          <View
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              backgroundColor: "#ECFDF5",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#059669" }}>
              Match
            </Text>
          </View>
        )}

        {/* Client row */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B7280" }}>
              {item.clientName.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}>
              {item.clientName}
            </Text>
            <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 6,
            lineHeight: 22,
            letterSpacing: -0.2,
          }}
        >
          {item.title}
        </Text>

        {/* Description */}
        <Text
          numberOfLines={2}
          style={{
            fontSize: 13,
            color: "#6B7280",
            lineHeight: 19,
            marginBottom: 14,
          }}
        >
          {item.description}
        </Text>

        {/* Tags */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {tags.map((tag, i) => (
            <View
              key={i}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "500", color: "#374151" }}>
                {tag.trim()}
              </Text>
            </View>
          ))}
          {item.location && (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "500", color: "#374151" }}>
                {item.location}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom row: budget + button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
            paddingTop: 14,
          }}
        >
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827", letterSpacing: -0.5 }}>
              {"$"}{item.budget}
              <Text style={{ fontSize: 13, fontWeight: "500", color: "#9CA3AF" }}>/hr</Text>
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => handleApply(item)}
            disabled={isApplied || isApplying}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 11,
              borderRadius: 12,
              backgroundColor: isApplied ? "#F0FDF4" : "#111827",
              borderWidth: isApplied ? 1 : 0,
              borderColor: "#BBF7D0",
            }}
          >
            {isApplying ? (
              <ActivityIndicator size="small" color={isApplied ? "#059669" : "#FFFFFF"} />
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: isApplied ? "#059669" : "#FFFFFF",
                  letterSpacing: 0.2,
                }}
              >
                {isApplied ? "Applied" : "Apply Now"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  /* ─────────────────── Stats Card ─────────────────── */
  const StatsCard = () => (
    <View
      style={{
        backgroundColor: "#111827",
        borderRadius: 20,
        padding: 22,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700", letterSpacing: -0.2 }}>
          Overview
        </Text>
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "500" }}>
            All Time
          </Text>
        </View>
      </View>

      {/* Earnings */}
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "500", marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>
        Earnings
      </Text>
      <Text style={{ color: "#FFFFFF", fontSize: 36, fontWeight: "800", marginBottom: 4, letterSpacing: -1 }}>
        $9,787
        <Text style={{ color: "rgba(255,255,255,0.25)" }}>.32</Text>
      </Text>
      <Text style={{ color: "#34D399", fontSize: 13, fontWeight: "600", marginBottom: 22 }}>
        +$2,456.12 this month
      </Text>

      {/* Projects & Clients */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "800", marginBottom: 2 }}>36</Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "500" }}>Projects</Text>
          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>5 this month</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 26, fontWeight: "800", marginBottom: 2 }}>10</Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "500" }}>Clients</Text>
          <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>3 this month</Text>
        </View>
      </View>

      {/* Achievement */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <View>
          <Text style={{ color: "#111827", fontSize: 20, fontWeight: "800" }}>5th place</Text>
          <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "500", marginTop: 2 }}>Top-hire freelancers</Text>
        </View>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#FEF3C7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22 }}>{"🏆"}</Text>
        </View>
      </View>

      {/* Availability */}
      <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600", marginBottom: 10 }}>
        Availability
      </Text>
      <View style={{ flexDirection: "row", gap: 2, marginBottom: 8 }}>
        {[...Array(30)].map((_, i) => {
          const opacity = 0.15 + (i / 30) * 0.85
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 4,
                backgroundColor: `rgba(99, 102, 241, ${opacity})`,
              }}
            />
          )
        })}
      </View>
      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "500" }}>
        100h/month
      </Text>
    </View>
  )

  /* ─────────────────── CTA Card ─────────────────── */
  const CTACard = () => (
    <View
      style={{
        backgroundColor: "#F9FAFB",
        borderRadius: 20,
        padding: 24,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: "#111827",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 24, color: "#FFFFFF" }}>{"🔗"}</Text>
      </View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: "#111827",
          textAlign: "center",
          marginBottom: 8,
          letterSpacing: -0.3,
        }}
      >
        Get new clients 2x faster
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: "#6B7280",
          textAlign: "center",
          lineHeight: 19,
          paddingHorizontal: 16,
          marginBottom: 20,
        }}
      >
        Join us today and unlock opportunities to land new clients twice as fast!
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        style={{
          backgroundColor: "#111827",
          paddingVertical: 14,
          paddingHorizontal: 32,
          borderRadius: 14,
          width: "100%",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700", letterSpacing: 0.2 }}>
          Join now
        </Text>
      </TouchableOpacity>
    </View>
  )

  /* ─────────────────── Income Card ─────────────────── */
  const IncomeCard = () => (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 22,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <Text style={{ color: "#111827", fontSize: 17, fontWeight: "700", letterSpacing: -0.2 }}>
          Income
        </Text>
        <View
          style={{
            backgroundColor: "#F3F4F6",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#6B7280", fontSize: 12, fontWeight: "500" }}>Monthly</Text>
        </View>
      </View>

      {/* April */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827", letterSpacing: -0.5, marginBottom: 2 }}>
          $2,167.56
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 12, fontWeight: "500", marginBottom: 10 }}>April</Text>
        <View style={{ flexDirection: "row", gap: 3, height: 6, borderRadius: 3, overflow: "hidden" }}>
          <View style={{ backgroundColor: "#6366F1", width: "30%", borderRadius: 3 }} />
          <View style={{ backgroundColor: "#EC4899", width: "25%", borderRadius: 3 }} />
          <View style={{ backgroundColor: "#F59E0B", width: "20%", borderRadius: 3 }} />
          <View style={{ backgroundColor: "#F97316", width: "15%", borderRadius: 3 }} />
        </View>
      </View>

      {/* March */}
      <View>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827", letterSpacing: -0.5, marginBottom: 2 }}>
          $1,367.50
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 12, fontWeight: "500", marginBottom: 10 }}>March</Text>
        <View style={{ flexDirection: "row", gap: 3, height: 6, borderRadius: 3, overflow: "hidden" }}>
          <View style={{ backgroundColor: "#6366F1", width: "20%", borderRadius: 3 }} />
          <View style={{ backgroundColor: "#EC4899", width: "40%", borderRadius: 3 }} />
          <View style={{ backgroundColor: "#F59E0B", width: "30%", borderRadius: 3 }} />
          <View style={{ backgroundColor: "#F97316", width: "5%", borderRadius: 3 }} />
        </View>
      </View>
    </View>
  )

  /* ─────────────────── Loading State ─────────────────── */
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAFAFA" }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
        <Text style={{ color: "#6B7280", fontSize: 13, fontWeight: "500" }}>Loading jobs...</Text>
      </SafeAreaView>
    )
  }

  /* ─────────────────── Main Render ─────────────────── */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchJobs} tintColor="#111827" />}
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <View>
              <Text style={{ color: "#9CA3AF", fontSize: 13, fontWeight: "500", marginBottom: 2 }}>
                Welcome back,
              </Text>
              <Text style={{ fontSize: 26, fontWeight: "800", color: "#111827", letterSpacing: -0.5 }}>
                {user?.firstName || "Freelancer"}
              </Text>
            </View>
            {user?.id && <NotificationBell userId={user.id} />}
          </View>

          {/* ── Search ── */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 13,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ color: "#9CA3AF", marginRight: 10, fontSize: 16 }}>{"🔍"}</Text>
            <TextInput
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t)
                searchJobs(t)
              }}
              placeholder="Search jobs or skills..."
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                fontSize: 14,
                color: "#111827",
                fontWeight: "500",
              }}
            />
            {isSearching && <ActivityIndicator size="small" color="#6366F1" />}
          </View>
        </View>

        {/* ── Content ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }}>
          {/* Section header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", letterSpacing: -0.2 }}>
              Available Jobs
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#6366F1" }}>
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
            </Text>
          </View>

          {/* Jobs */}
          {jobs.length === 0 ? (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 40,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Text style={{ fontSize: 24 }}>{"💼"}</Text>
              </View>
              <Text style={{ color: "#6B7280", textAlign: "center", fontSize: 14, fontWeight: "500" }}>
                No jobs found. Try adjusting your search.
              </Text>
            </View>
          ) : (
            jobs.map((job) => (
              <View key={job.id}>{renderJobCard({ item: job })}</View>
            ))
          )}

          {/* Spacer between jobs and stats */}
          <View style={{ height: 8 }} />

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
