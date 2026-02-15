"use client"

import { NotificationBell } from "@/components/Notifications"
import { ApplicationModal } from "@/components/ApplicationModal"
import { fetchAPI } from "@/lib/fetch"
import { useUser } from "@clerk/clerk-expo"
import { router } from "expo-router"
import { useEffect, useState, useRef } from "react"
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Animated,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

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
  const [activeFilter, setActiveFilter] = useState("All")
  const scrollY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isSignedIn === false) {
      router.replace("/")
    }
  }, [isSignedIn])

  const loadAppliedJobs = async () => {
    try {
      if (!user?.id) return
      
      const stored = await AsyncStorage.getItem(`appliedJobs_${user.id}`)
      if (stored) {
        const jobIds = JSON.parse(stored)
        setAppliedJobs(new Set(jobIds))
        console.log(`[Apply] Loaded ${jobIds.length} applied jobs from storage`)
      }
      
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
            await AsyncStorage.setItem(`appliedJobs_${user.id}`, JSON.stringify(appliedJobIds))
            console.log(`[Apply] Loaded ${appliedJobIds.length} applied jobs from API`)
          }
        }
      } catch (apiError) {
        console.warn('[Apply] Could not fetch applications from API:', apiError)
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

      setAppliedJobs((s) => {
        const updated = new Set(s).add(selectedJob.id)
        AsyncStorage.setItem(`appliedJobs_${user.id}`, JSON.stringify(Array.from(updated)))
          .catch(err => console.warn('Failed to save to storage:', err))
        return updated
      })
      
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

  const filters = ["All", "Matched", "Recent", "High Budget"]

  const getFilteredJobs = () => {
    switch (activeFilter) {
      case "Matched":
        return jobs.filter((j) => j.isMatch)
      case "Recent":
        return [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case "High Budget":
        return [...jobs].sort((a, b) => b.budget - a.budget)
      default:
        return jobs
    }
  }

  /* ─────────────────── Job Card ─────────────────── */
  const renderJobCard = ({ item }: { item: Job }) => {
    const isApplied = appliedJobs.has(item.id)
    const isApplying = applyingJobs.has(item.id)
    const tags = item.category.split(",").slice(0, 3)

    return (
      <TouchableOpacity
        activeOpacity={0.97}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          marginBottom: 14,
          borderWidth: 1,
          borderColor: item.isMatch ? "rgba(16, 185, 129, 0.18)" : "rgba(0,0,0,0.04)",
          overflow: "hidden",
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.05,
              shadowRadius: 20,
            },
            android: { elevation: 3 },
          }),
        }}
      >
        <View style={{ padding: 20 }}>
          {/* Row 1: Avatar + Client + Match + Time */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            {/* Avatar circle */}
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: item.isMatch ? "#F0FDF4" : "#F4F4F5",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
                borderWidth: 1.5,
                borderColor: item.isMatch ? "rgba(16, 185, 129, 0.2)" : "rgba(0,0,0,0.04)",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: item.isMatch ? "#059669" : "#71717A",
                }}
              >
                {item.clientName.charAt(0)}
              </Text>
            </View>

            {/* Client name + meta */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#18181B", letterSpacing: -0.1 }}>
                {item.clientName}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, gap: 5 }}>
                <Text style={{ fontSize: 12, color: "#A1A1AA" }}>
                  {item.location}
                </Text>
                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#D4D4D8" }} />
                <Text style={{ fontSize: 12, color: "#A1A1AA" }}>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
            </View>

            {/* Match badge */}
            {item.isMatch && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#F0FDF4",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "rgba(16, 185, 129, 0.12)",
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" }} />
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#059669" }}>
                  Match
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: "#18181B",
              marginBottom: 8,
              lineHeight: 24,
              letterSpacing: -0.3,
            }}
          >
            {item.title}
          </Text>

          {/* Description */}
          <Text
            numberOfLines={2}
            style={{
              fontSize: 14,
              color: "#71717A",
              lineHeight: 21,
              marginBottom: 16,
              letterSpacing: 0.05,
            }}
          >
            {item.description}
          </Text>

          {/* Tags */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {tags.map((tag, i) => (
              <View
                key={i}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: "#F4F4F5",
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.03)",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "500", color: "#52525B" }}>
                  {tag.trim()}
                </Text>
              </View>
            ))}
          </View>

          {/* Bottom bar: Budget + Apply */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: "#F4F4F5",
            }}
          >
            <View>
              <Text style={{ fontSize: 11, fontWeight: "500", color: "#A1A1AA", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 3 }}>
                Budget
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                <Text style={{ fontSize: 24, fontWeight: "800", color: "#18181B", letterSpacing: -0.8 }}>
                  {"$"}{item.budget}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleApply(item)}
              disabled={isApplied || isApplying}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: isApplied ? 20 : 28,
                paddingVertical: 13,
                borderRadius: 14,
                backgroundColor: isApplied ? "#F0FDF4" : "#18181B",
                borderWidth: isApplied ? 1 : 0,
                borderColor: isApplied ? "rgba(16, 185, 129, 0.2)" : "transparent",
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                ...(!isApplied
                  ? Platform.select({
                      ios: {
                        shadowColor: "#18181B",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                      },
                      android: { elevation: 4 },
                    })
                  : {}),
              }}
            >
              {isApplying ? (
                <ActivityIndicator size="small" color={isApplied ? "#10B981" : "#FFFFFF"} />
              ) : (
                <>
                  {isApplied && (
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: "#10B981",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>{"✓"}</Text>
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: isApplied ? "#059669" : "#FFFFFF",
                      letterSpacing: 0.1,
                    }}
                  >
                    {isApplied ? "Applied" : "Apply Now"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  /* ─────────────────── Stats Card ─────────────────── */
  const StatsCard = () => (
    <View
      style={{
        backgroundColor: "#18181B",
        borderRadius: 24,
        padding: 24,
        marginBottom: 14,
        overflow: "hidden",
        ...Platform.select({
          ios: {
            shadowColor: "#18181B",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.25,
            shadowRadius: 28,
          },
          android: { elevation: 16 },
        }),
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" }} />
          <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700", letterSpacing: -0.3 }}>
            Overview
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" }}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Earnings */}
      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 1.2, textTransform: "uppercase" }}>
        Earnings
      </Text>
      <Text style={{ color: "#FFFFFF", fontSize: 42, fontWeight: "800", marginBottom: 8, letterSpacing: -2 }}>
        $9,787
        <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 28 }}>.32</Text>
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 32 }}>
        <View style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ color: "#34D399", fontSize: 13, fontWeight: "700" }}>
            +$2,456.12
          </Text>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: "500" }}>
          this month
        </Text>
      </View>

      {/* Projects & Clients */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 18,
            padding: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "800", marginBottom: 6, letterSpacing: -1 }}>36</Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "600" }}>Projects</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" }} />
            <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: "500" }}>5 this month</Text>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 18,
            padding: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "800", marginBottom: 6, letterSpacing: -1 }}>10</Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "600" }}>Clients</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#818CF8" }} />
            <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: "500" }}>3 this month</Text>
          </View>
        </View>
      </View>

      {/* Achievement */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 18,
          padding: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <View>
          <Text style={{ color: "#18181B", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>5th place</Text>
          <Text style={{ color: "#A1A1AA", fontSize: 13, fontWeight: "500", marginTop: 3 }}>Top-hire freelancers</Text>
        </View>
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 16,
            backgroundColor: "#FEF9EF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 24 }}>{"🏆"}</Text>
        </View>
      </View>

      {/* Availability */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>
          Availability
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: "500" }}>
          100h/month
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {[...Array(30)].map((_, i) => {
          const opacity = 0.08 + (i / 30) * 0.92
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: 32,
                borderRadius: 5,
                backgroundColor: `rgba(99, 102, 241, ${opacity})`,
              }}
            />
          )
        })}
      </View>
    </View>
  )

  /* ─────────────────── CTA Card ─────────────────── */
  const CTACard = () => (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 32,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
        alignItems: "center",
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 16,
          },
          android: { elevation: 2 },
        }),
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 20,
          backgroundColor: "#18181B",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          ...Platform.select({
            ios: {
              shadowColor: "#18181B",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
            },
            android: { elevation: 6 },
          }),
        }}
      >
        <Text style={{ fontSize: 26, color: "#FFFFFF" }}>{"🔗"}</Text>
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          color: "#18181B",
          textAlign: "center",
          marginBottom: 10,
          letterSpacing: -0.5,
        }}
      >
        Get new clients 2x faster
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: "#71717A",
          textAlign: "center",
          lineHeight: 22,
          paddingHorizontal: 8,
          marginBottom: 28,
        }}
      >
        Join us today and unlock opportunities to land new clients twice as fast!
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        style={{
          backgroundColor: "#18181B",
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 14,
          width: "100%",
          alignItems: "center",
          ...Platform.select({
            ios: {
              shadowColor: "#18181B",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            },
            android: { elevation: 4 },
          }),
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700", letterSpacing: 0.1 }}>
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
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 16,
          },
          android: { elevation: 2 },
        }),
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <Text style={{ color: "#18181B", fontSize: 17, fontWeight: "700", letterSpacing: -0.3 }}>
          Income
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            backgroundColor: "#F4F4F5",
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#71717A", fontSize: 12, fontWeight: "600" }}>Monthly</Text>
        </TouchableOpacity>
      </View>

      {/* April */}
      <View style={{ marginBottom: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ color: "#A1A1AA", fontSize: 13, fontWeight: "600" }}>April</Text>
          <View style={{ backgroundColor: "#F0FDF4", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ color: "#059669", fontSize: 11, fontWeight: "600" }}>+18%</Text>
          </View>
        </View>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#18181B", letterSpacing: -0.8, marginBottom: 14 }}>
          $2,167.56
        </Text>
        <View style={{ flexDirection: "row", gap: 3, height: 10, borderRadius: 5, overflow: "hidden" }}>
          <View style={{ backgroundColor: "#6366F1", width: "30%", borderRadius: 5 }} />
          <View style={{ backgroundColor: "#EC4899", width: "25%", borderRadius: 5 }} />
          <View style={{ backgroundColor: "#F59E0B", width: "20%", borderRadius: 5 }} />
          <View style={{ backgroundColor: "#F97316", width: "15%", borderRadius: 5 }} />
        </View>
        {/* Legend */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 14 }}>
          {[
            { color: "#6366F1", label: "Design" },
            { color: "#EC4899", label: "Dev" },
            { color: "#F59E0B", label: "Consult" },
            { color: "#F97316", label: "Other" },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
              <Text style={{ fontSize: 11, color: "#A1A1AA", fontWeight: "500" }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: "#F4F4F5", marginBottom: 28 }} />

      {/* March */}
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ color: "#A1A1AA", fontSize: 13, fontWeight: "600" }}>March</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#18181B", letterSpacing: -0.8, marginBottom: 14 }}>
          $1,367.50
        </Text>
        <View style={{ flexDirection: "row", gap: 3, height: 10, borderRadius: 5, overflow: "hidden" }}>
          <View style={{ backgroundColor: "#6366F1", width: "20%", borderRadius: 5 }} />
          <View style={{ backgroundColor: "#EC4899", width: "40%", borderRadius: 5 }} />
          <View style={{ backgroundColor: "#F59E0B", width: "30%", borderRadius: 5 }} />
          <View style={{ backgroundColor: "#F97316", width: "5%", borderRadius: 5 }} />
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
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: "#18181B",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            ...Platform.select({
              ios: {
                shadowColor: "#18181B",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
              },
              android: { elevation: 8 },
            }),
          }}
        >
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
        <Text style={{ color: "#71717A", fontSize: 15, fontWeight: "600", letterSpacing: -0.2 }}>Loading jobs...</Text>
      </SafeAreaView>
    )
  }

  const filteredJobs = getFilteredJobs()

  /* ─────────────────── Main Render ─────────────────── */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchJobs} tintColor="#18181B" />}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#A1A1AA", fontSize: 14, fontWeight: "500", marginBottom: 6 }}>
                Welcome back,
              </Text>
              <Text style={{ fontSize: 30, fontWeight: "800", color: "#18181B", letterSpacing: -1 }}>
                {user?.firstName || "Freelancer"}
              </Text>
            </View>
            {user?.id && <NotificationBell userId={user.id} />}
          </View>

          {/* ── Search ── */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              paddingHorizontal: 18,
              paddingVertical: 15,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.05)",
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                },
                android: { elevation: 2 },
              }),
            }}
          >
            <Text style={{ color: "#A1A1AA", marginRight: 12, fontSize: 18 }}>{"🔍"}</Text>
            <TextInput
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t)
                searchJobs(t)
              }}
              placeholder="Search jobs or skills..."
              placeholderTextColor="#A1A1AA"
              style={{
                flex: 1,
                fontSize: 15,
                color: "#18181B",
                fontWeight: "500",
              }}
            />
            {isSearching && <ActivityIndicator size="small" color="#6366F1" />}
          </View>
        </View>

        {/* ── Content ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          {/* Section header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#18181B", letterSpacing: -0.5 }}>
              Available Jobs
            </Text>
            <View
              style={{
                backgroundColor: "#18181B",
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
                {filteredJobs.length}
              </Text>
            </View>
          </View>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {filters.map((filter) => {
              const isActive = activeFilter === filter
              return (
                <TouchableOpacity
                  key={filter}
                  activeOpacity={0.8}
                  onPress={() => setActiveFilter(filter)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: isActive ? "#18181B" : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: isActive ? "#18181B" : "rgba(0,0,0,0.06)",
                    ...(!isActive
                      ? Platform.select({
                          ios: {
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.03,
                            shadowRadius: 4,
                          },
                          android: { elevation: 1 },
                        })
                      : {}),
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: isActive ? "#FFFFFF" : "#71717A",
                    }}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Jobs */}
          {filteredJobs.length === 0 ? (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 56,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.04)",
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  backgroundColor: "#F4F4F5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontSize: 32 }}>{"💼"}</Text>
              </View>
              <Text style={{ color: "#52525B", textAlign: "center", fontSize: 16, fontWeight: "600", marginBottom: 6 }}>
                No jobs found
              </Text>
              <Text style={{ color: "#A1A1AA", textAlign: "center", fontSize: 14, fontWeight: "400", lineHeight: 21 }}>
                Try adjusting your search or filters.
              </Text>
            </View>
          ) : (
            filteredJobs.map((job) => (
              <View key={job.id}>{renderJobCard({ item: job })}</View>
            ))
          )}

          {/* Section divider */}
          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 28, gap: 14 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E4E4E7" }} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#A1A1AA", letterSpacing: 0.6, textTransform: "uppercase" }}>
              Your Dashboard
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E4E4E7" }} />
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
