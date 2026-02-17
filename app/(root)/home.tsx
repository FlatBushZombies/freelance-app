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
  Image,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  // Greens
  sage:       "#B8D4BA",   // soft sage — primary accent
  forest:     "#2D6A4F",   // deep forest — primary text accent
  mint:       "#D8EDDA",   // lightest mint — backgrounds
  fern:       "#52B788",   // medium green — highlights
  moss:       "#40916C",   // moss — interactive
  leaf:       "#74C69D",   // leaf — secondary accent

  // Neutrals
  ink:        "#1A1F1C",   // near-black with green undertone
  charcoal:   "#2C3330",   // card dark surfaces
  stone:      "#6B7970",   // body text
  pebble:     "#A8B5AD",   // muted text
  mist:       "#F2F7F3",   // page background
  cloud:      "#FFFFFF",   // card surface
  fog:        "#EBF2EC",   // subtle borders / chip bg

  // Status
  gold:       "#C9A84C",   // earnings / achievement
  goldLight:  "#FBF5E6",   // gold bg
}

const shadow = {
  card: Platform.select({
    ios: { shadowColor: "#2D6A4F", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 24 },
    android: { elevation: 3 },
  }),
  dark: Platform.select({
    ios: { shadowColor: "#1A1F1C", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 28 },
    android: { elevation: 16 },
  }),
  btn: Platform.select({
    ios: { shadowColor: "#2D6A4F", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14 },
    android: { elevation: 6 },
  }),
  sm: Platform.select({
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    android: { elevation: 1 },
  }),
}
// ──────────────────────────────────────────────────────────────

interface Job {
  id: string
  title: string
  description: string
  budget: number
  category: string
  location: string
  createdAt: string
  clientName: string
  clientAvatar: string | null
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
          headers: { 'Authorization': `Bearer ${token}` },
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
            createdAt: job.createdAt || new Date().toISOString(),
            clientName: job.userName || "Anonymous Client",
            clientAvatar: job.userAvatar || null,
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
    if (!query.trim()) { fetchJobs(); return }
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
            createdAt: job.createdAt || new Date().toISOString(),
            clientName: job.userName || "Anonymous Client",
            clientAvatar: job.userAvatar || null,
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
    if (user?.id) { loadAppliedJobs(); fetchUserSkills(); fetchJobs() }
  }, [user])

  useEffect(() => {
    if (userSkills && jobs.length) { searchJobs(userSkills) }
  }, [userSkills])

  const handleApply = async (job: Job) => {
    if (!user?.id) { Alert.alert("Sign in required"); return }
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
      try { data = await response.json() } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error('Server error. Please contact support or try again later.')
      }
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to apply")
      setAppliedJobs((s) => {
        const updated = new Set(s).add(selectedJob.id)
        AsyncStorage.setItem(`appliedJobs_${user.id}`, JSON.stringify(Array.from(updated)))
          .catch(err => console.warn('Failed to save to storage:', err))
        return updated
      })
      const message = data.alreadyApplied ? "You've already applied to this job" : "The client has been notified"
      Toast.show({ type: "success", text1: data.alreadyApplied ? "Already applied" : "Applied successfully", text2: message, position: "bottom", visibilityTime: 3000, autoHide: true })
    } catch (error) {
      console.error("Apply error:", error)
      Toast.show({ type: "error", text1: "Application failed", text2: error instanceof Error ? error.message : "Please try again", position: "bottom", visibilityTime: 3000, autoHide: true })
    } finally {
      setApplyingJobs((s) => { const next = new Set(s); next.delete(selectedJob.id); return next })
    }
  }

  const timeAgo = (date: string) => {
    const diffMs = Date.now() - new Date(date).getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const filters = ["All", "Matched", "Recent", "High Budget"]

  const getFilteredJobs = () => {
    switch (activeFilter) {
      case "Matched": return jobs.filter((j) => j.isMatch)
      case "Recent": return [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case "High Budget": return [...jobs].sort((a, b) => b.budget - a.budget)
      default: return jobs
    }
  }

  /* ─────────────────── Job Card ─────────────────── */
  const renderJobCard = ({ item }: { item: Job }) => {
    const isApplied = appliedJobs.has(item.id)
    const isApplying = applyingJobs.has(item.id)
    const tags = item.category.split(",").slice(0, 3)

    return (
      <TouchableOpacity
        activeOpacity={0.96}
        style={{
          backgroundColor: C.cloud,
          borderRadius: 22,
          marginBottom: 16,
          borderWidth: 1.5,
          borderColor: item.isMatch ? `${C.fern}30` : `${C.fog}`,
          overflow: "hidden",
          ...shadow.card,
        }}
      >
        {/* Match accent bar */}
        {item.isMatch && (
          <View style={{ height: 3, backgroundColor: C.fern, width: "100%" }} />
        )}

        <View style={{ padding: 20 }}>
          {/* Row 1: Avatar + Client meta + Badge + Time */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            {/* Avatar */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: item.isMatch ? `${C.mint}` : C.fog,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
                borderWidth: 1.5,
                borderColor: item.isMatch ? `${C.fern}40` : `${C.fog}`,
                overflow: "hidden",
              }}
            >
              {item.clientAvatar ? (
                <Image source={{ uri: item.clientAvatar }} style={{ width: 44, height: 44 }} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: "800", color: item.isMatch ? C.forest : C.stone, letterSpacing: -0.3 }}>
                  {item.clientName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            {/* Name & meta */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.ink, letterSpacing: -0.1 }}>
                {item.clientName}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, gap: 6 }}>
                <Text style={{ fontSize: 11, color: C.pebble, fontWeight: "500" }}>
                  {"📍"} {item.location}
                </Text>
                <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: C.pebble }} />
                <Text style={{ fontSize: 11, color: C.pebble, fontWeight: "500" }}>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
            </View>

            {/* Match badge */}
            {item.isMatch && (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: `${C.fern}18`,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: `${C.fern}30`,
              }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.fern }} />
                <Text style={{ fontSize: 10, fontWeight: "700", color: C.forest, letterSpacing: 0.4 }}>
                  MATCH
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={{
            fontSize: 18,
            fontWeight: "800",
            color: C.ink,
            marginBottom: 8,
            lineHeight: 25,
            letterSpacing: -0.5,
          }}>
            {item.title}
          </Text>

          {/* Description */}
          <Text numberOfLines={2} style={{
            fontSize: 14,
            color: C.stone,
            lineHeight: 22,
            marginBottom: 16,
            letterSpacing: 0.1,
            fontWeight: "400",
          }}>
            {item.description}
          </Text>

          {/* Tags */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {tags.map((tag, i) => (
              <View key={i} style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: i === 0 && item.isMatch ? `${C.mint}` : C.fog,
                borderWidth: 1,
                borderColor: i === 0 && item.isMatch ? `${C.fern}25` : "rgba(0,0,0,0.03)",
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: i === 0 && item.isMatch ? C.forest : C.stone,
                  letterSpacing: 0.2,
                }}>
                  {tag.trim()}
                </Text>
              </View>
            ))}
          </View>

          {/* Bottom: Budget + Apply */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: C.fog,
          }}>
            <View>
              <Text style={{
                fontSize: 10,
                fontWeight: "700",
                color: C.pebble,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                marginBottom: 4,
              }}>
                Budget
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: C.moss, marginBottom: 2 }}>$</Text>
                <Text style={{ fontSize: 28, fontWeight: "900", color: C.ink, letterSpacing: -1.2 }}>
                  {item.budget}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleApply(item)}
              disabled={isApplied || isApplying}
              activeOpacity={0.82}
              style={{
                paddingHorizontal: isApplied ? 18 : 26,
                paddingVertical: 14,
                borderRadius: 14,
                backgroundColor: isApplied ? `${C.mint}` : C.forest,
                borderWidth: isApplied ? 1.5 : 0,
                borderColor: isApplied ? `${C.fern}40` : "transparent",
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                ...(isApplied ? {} : shadow.btn),
              }}
            >
              {isApplying ? (
                <ActivityIndicator size="small" color={isApplied ? C.forest : C.cloud} />
              ) : (
                <>
                  {isApplied && (
                    <View style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: C.fern,
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Text style={{ color: C.cloud, fontSize: 10, fontWeight: "900" }}>✓</Text>
                    </View>
                  )}
                  <Text style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: isApplied ? C.forest : C.cloud,
                    letterSpacing: 0.2,
                  }}>
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
    <View style={{
      backgroundColor: C.charcoal,
      borderRadius: 28,
      padding: 26,
      marginBottom: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: `${C.forest}60`,
      ...shadow.dark,
    }}>
      {/* Decorative top accent line */}
      <View style={{
        position: "absolute",
        top: 0, left: 32, right: 32,
        height: 2,
        backgroundColor: C.fern,
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
        opacity: 0.8,
      }} />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.fern }} />
          <Text style={{ color: C.cloud, fontSize: 17, fontWeight: "800", letterSpacing: -0.4 }}>
            Overview
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "600" }}>All Time</Text>
        </TouchableOpacity>
      </View>

      {/* Earnings */}
      <Text style={{
        color: C.pebble,
        fontSize: 10,
        fontWeight: "700",
        marginBottom: 10,
        letterSpacing: 1.8,
        textTransform: "uppercase",
      }}>
        Total Earnings
      </Text>
      <Text style={{ color: C.cloud, fontSize: 44, fontWeight: "900", marginBottom: 10, letterSpacing: -2.5 }}>
        $9,787
        <Text style={{ color: `${C.sage}50`, fontSize: 30, fontWeight: "700" }}>.32</Text>
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <View style={{
          backgroundColor: `${C.fern}22`,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: `${C.fern}30`,
        }}>
          <Text style={{ color: C.leaf, fontSize: 12, fontWeight: "700" }}>+$2,456.12</Text>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, fontWeight: "500" }}>this month</Text>
      </View>

      {/* Projects & Clients */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        {[
          { value: "36", label: "Projects", sub: "5 this month", dot: C.fern },
          { value: "10", label: "Clients", sub: "3 this month", dot: C.sage },
        ].map((stat, i) => (
          <View key={i} style={{
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: 18,
            padding: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.06)",
          }}>
            <Text style={{ color: C.cloud, fontSize: 32, fontWeight: "900", marginBottom: 5, letterSpacing: -1.5 }}>
              {stat.value}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "600" }}>{stat.label}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: stat.dot }} />
              <Text style={{ color: "rgba(255,255,255,0.22)", fontSize: 11, fontWeight: "500" }}>{stat.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Achievement */}
      <View style={{
        backgroundColor: C.goldLight,
        borderRadius: 18,
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: `${C.gold}25`,
      }}>
        <View>
          <Text style={{ color: C.ink, fontSize: 22, fontWeight: "900", letterSpacing: -0.6 }}>5th place</Text>
          <Text style={{ color: "#9A8A6A", fontSize: 13, fontWeight: "500", marginTop: 3 }}>Top-hire freelancers</Text>
        </View>
        <View style={{
          width: 52,
          height: 52,
          borderRadius: 18,
          backgroundColor: "#FDF0CC",
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: `${C.gold}30`,
        }}>
          <Text style={{ fontSize: 26 }}>🏆</Text>
        </View>
      </View>

      {/* Availability */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ color: C.cloud, fontSize: 13, fontWeight: "700" }}>Availability</Text>
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: "500" }}>100h / month</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {[...Array(30)].map((_, i) => {
          const filled = i < 22
          return (
            <View key={i} style={{
              flex: 1,
              height: 28,
              borderRadius: 4,
              backgroundColor: filled
                ? `rgba(82, 183, 136, ${0.15 + (i / 30) * 0.85})`
                : "rgba(255,255,255,0.05)",
            }} />
          )
        })}
      </View>
    </View>
  )

  /* ─────────────────── CTA Card ─────────────────── */
  const CTACard = () => (
    <View style={{
      backgroundColor: C.forest,
      borderRadius: 28,
      padding: 32,
      marginBottom: 14,
      alignItems: "center",
      overflow: "hidden",
      ...shadow.dark,
    }}>
      {/* Decorative radial circles */}
      <View style={{
        position: "absolute",
        top: -50, right: -50,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: `${C.fern}18`,
      }} />
      <View style={{
        position: "absolute",
        bottom: -30, left: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: `${C.leaf}12`,
      }} />

      <View style={{
        width: 64,
        height: 64,
        borderRadius: 22,
        backgroundColor: `${C.fern}30`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 22,
        borderWidth: 1.5,
        borderColor: `${C.fern}40`,
      }}>
        <Text style={{ fontSize: 28 }}>🔗</Text>
      </View>
      <Text style={{
        fontSize: 24,
        fontWeight: "900",
        color: C.cloud,
        textAlign: "center",
        marginBottom: 12,
        letterSpacing: -0.8,
        lineHeight: 30,
      }}>
        Get new clients{"\n"}2× faster
      </Text>
      <Text style={{
        fontSize: 14,
        color: `${C.sage}CC`,
        textAlign: "center",
        lineHeight: 22,
        paddingHorizontal: 10,
        marginBottom: 28,
        fontWeight: "400",
      }}>
        Join us today and unlock opportunities to land new clients twice as fast!
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        style={{
          backgroundColor: C.cloud,
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 14,
          width: "100%",
          alignItems: "center",
          ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
            android: { elevation: 5 },
          }),
        }}
      >
        <Text style={{ color: C.forest, fontSize: 15, fontWeight: "800", letterSpacing: 0.3 }}>
          Join now →
        </Text>
      </TouchableOpacity>
    </View>
  )

  /* ─────────────────── Income Card ─────────────────── */
  const IncomeCard = () => (
    <View style={{
      backgroundColor: C.cloud,
      borderRadius: 28,
      padding: 24,
      borderWidth: 1.5,
      borderColor: C.fog,
      ...shadow.card,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <Text style={{ color: C.ink, fontSize: 17, fontWeight: "800", letterSpacing: -0.4 }}>Income</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ backgroundColor: C.fog, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 }}
        >
          <Text style={{ color: C.stone, fontSize: 12, fontWeight: "600" }}>Monthly</Text>
        </TouchableOpacity>
      </View>

      {/* April */}
      <View style={{ marginBottom: 28 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ color: C.pebble, fontSize: 13, fontWeight: "700", letterSpacing: 0.3 }}>April</Text>
          <View style={{ backgroundColor: `${C.fern}18`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ color: C.forest, fontSize: 11, fontWeight: "700" }}>+18%</Text>
          </View>
        </View>
        <Text style={{ fontSize: 30, fontWeight: "900", color: C.ink, letterSpacing: -1.2, marginBottom: 14 }}>
          $2,167.56
        </Text>
        {/* Bar */}
        <View style={{ flexDirection: "row", gap: 3, height: 10, borderRadius: 6, overflow: "hidden" }}>
          <View style={{ backgroundColor: C.moss, width: "30%", borderRadius: 6 }} />
          <View style={{ backgroundColor: C.fern, width: "25%", borderRadius: 6 }} />
          <View style={{ backgroundColor: C.leaf, width: "20%", borderRadius: 6 }} />
          <View style={{ backgroundColor: C.sage, width: "15%", borderRadius: 6 }} />
        </View>
        {/* Legend */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 14 }}>
          {[
            { color: C.moss, label: "Design" },
            { color: C.fern, label: "Dev" },
            { color: C.leaf, label: "Consult" },
            { color: C.sage, label: "Other" },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: item.color }} />
              <Text style={{ fontSize: 11, color: C.pebble, fontWeight: "600" }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: C.fog, marginBottom: 28 }} />

      {/* March */}
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ color: C.pebble, fontSize: 13, fontWeight: "700", letterSpacing: 0.3 }}>March</Text>
        </View>
        <Text style={{ fontSize: 30, fontWeight: "900", color: C.ink, letterSpacing: -1.2, marginBottom: 14 }}>
          $1,367.50
        </Text>
        <View style={{ flexDirection: "row", gap: 3, height: 10, borderRadius: 6, overflow: "hidden" }}>
          <View style={{ backgroundColor: C.moss, width: "20%", borderRadius: 6 }} />
          <View style={{ backgroundColor: C.fern, width: "40%", borderRadius: 6 }} />
          <View style={{ backgroundColor: C.leaf, width: "30%", borderRadius: 6 }} />
          <View style={{ backgroundColor: C.sage, width: "5%", borderRadius: 6 }} />
        </View>
      </View>
    </View>
  )

  /* ─────────────────── Loading State ─────────────────── */
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.mist }}>
        <View style={{
          width: 60,
          height: 60,
          borderRadius: 20,
          backgroundColor: C.forest,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          ...shadow.btn,
        }}>
          <ActivityIndicator size="small" color={C.cloud} />
        </View>
        <Text style={{ color: C.pebble, fontSize: 14, fontWeight: "600", letterSpacing: -0.2 }}>Loading jobs...</Text>
      </SafeAreaView>
    )
  }

  const filteredJobs = getFilteredJobs()

  /* ─────────────────── Main Render ─────────────────── */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.mist }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchJobs}
            tintColor={C.forest}
            colors={[C.forest]}
          />
        }
        contentContainerStyle={{ paddingBottom: 52 }}
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.fern }} />
                <Text style={{ color: C.pebble, fontSize: 13, fontWeight: "600", letterSpacing: 0.2 }}>
                  Welcome back
                </Text>
              </View>
              <Text style={{
                fontSize: 32,
                fontWeight: "900",
                color: C.ink,
                letterSpacing: -1.5,
                lineHeight: 36,
              }}>
                {user?.firstName || "Freelancer"} 👋
              </Text>
            </View>
            {user?.id && (
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: C.cloud,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: C.fog,
                ...shadow.sm,
              }}>
                <NotificationBell userId={user.id} />
              </View>
            )}
          </View>

          {/* ── Search ── */}
          <View style={{
            backgroundColor: C.cloud,
            borderRadius: 16,
            paddingHorizontal: 18,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: C.fog,
            ...shadow.sm,
          }}>
            <Text style={{ color: C.pebble, marginRight: 10, fontSize: 16 }}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t)
                searchJobs(t)
              }}
              placeholder="Search jobs or skills..."
              placeholderTextColor={C.pebble}
              style={{
                flex: 1,
                fontSize: 14,
                color: C.ink,
                fontWeight: "500",
              }}
            />
            {isSearching && <ActivityIndicator size="small" color={C.fern} />}
          </View>
        </View>

        {/* ── Content ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 26 }}>

          {/* Section header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: "900", color: C.ink, letterSpacing: -0.8 }}>
              Available Jobs
            </Text>
            <View style={{
              backgroundColor: C.forest,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
            }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: C.cloud, letterSpacing: 0.3 }}>
                {filteredJobs.length}
              </Text>
            </View>
          </View>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 22 }}
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
                    backgroundColor: isActive ? C.forest : C.cloud,
                    borderWidth: 1.5,
                    borderColor: isActive ? C.forest : C.fog,
                    ...(!isActive ? shadow.sm : {}),
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: isActive ? C.cloud : C.stone,
                    letterSpacing: 0.1,
                  }}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Jobs list */}
          {filteredJobs.length === 0 ? (
            <View style={{
              backgroundColor: C.cloud,
              borderRadius: 24,
              padding: 52,
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: C.fog,
              ...shadow.sm,
            }}>
              <View style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: C.mint,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
                borderWidth: 1.5,
                borderColor: `${C.fern}25`,
              }}>
                <Text style={{ fontSize: 32 }}>💼</Text>
              </View>
              <Text style={{ color: C.ink, textAlign: "center", fontSize: 17, fontWeight: "800", marginBottom: 6, letterSpacing: -0.4 }}>
                No jobs found
              </Text>
              <Text style={{ color: C.pebble, textAlign: "center", fontSize: 14, fontWeight: "400", lineHeight: 22 }}>
                Try adjusting your search or filters.
              </Text>
            </View>
          ) : (
            filteredJobs.map((job) => (
              <View key={job.id}>{renderJobCard({ item: job })}</View>
            ))
          )}

          {/* Section divider */}
          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 30, gap: 14 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: `${C.fog}` }} />
            <Text style={{
              fontSize: 10,
              fontWeight: "800",
              color: C.pebble,
              letterSpacing: 1.8,
              textTransform: "uppercase",
            }}>
              Your Dashboard
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: `${C.fog}` }} />
          </View>

          {/* Cards */}
          <StatsCard />
          <CTACard />
          <IncomeCard />
        </View>
      </ScrollView>

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