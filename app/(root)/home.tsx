"use client"

import { NotificationBell } from "@/components/Notifications"
import { ApplicationModal } from "@/components/ApplicationModal"
import {
  ApplicationRadar,
  type ApplicationRadarItem,
} from "@/components/ApplicationRadar"
import { fetchAPI, getApiUrl } from "@/lib/fetch"
import { useAuth, useUser } from "@clerk/clerk-expo"
import { router } from "expo-router"
import { useEffect, useState, useRef } from "react"
import * as Location from "expo-location"
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

const C = {
  sage:      "#B8C9D4",
  forest:    "#2D4A6A",
  mint:      "#D8E8ED",
  fern:      "#52839B",
  moss:      "#406891",
  leaf:      "#74A0B9",
  ink:       "#1A1C1F",
  charcoal:  "#2C3036",
  stone:     "#6B7479",
  pebble:    "#A8B2B5",
  mist:      "#F2F5F7",
  cloud:     "#FFFFFF",
  fog:       "#EBEff2",
  gold:      "#C9A84C",
  goldLight: "#FBF5E6",
  green:     "#2E7D52",
  greenLight:"#E8F5EE",
  greenMid:  "#3D9966",
}

const shadow = {
  card: Platform.select({
    ios: { shadowColor: "#2D4A6A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.07, shadowRadius: 24 },
    android: { elevation: 3 },
  }),
  dark: Platform.select({
    ios: { shadowColor: "#1A1C1F", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 28 },
    android: { elevation: 16 },
  }),
  btn: Platform.select({
    ios: { shadowColor: "#2D4A6A", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 14 },
    android: { elevation: 6 },
  }),
  btnGreen: Platform.select({
    ios: { shadowColor: "#2E7D52", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14 },
    android: { elevation: 6 },
  }),
  sm: Platform.select({
    ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
    android: { elevation: 1 },
  }),
  lifted: Platform.select({
    ios: { shadowColor: "#2D4A6A", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.12, shadowRadius: 32 },
    android: { elevation: 8 },
  }),
}

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
  inYourArea?: boolean
  distanceKm?: number | null
}

interface NearbyLocationState {
  loading: boolean
  label: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

const Home = () => {
  const { user, isSignedIn } = useUser()
  const { getToken } = useAuth()

  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userSkills, setUserSkills] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
  const [applicationRadar, setApplicationRadar] = useState<ApplicationRadarItem[]>([])
  const [applicationRadarLoading, setApplicationRadarLoading] = useState(true)
  const [applyingJobs, setApplyingJobs] = useState<Set<string>>(new Set())
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [activeFilter, setActiveFilter] = useState("All")
  const [nearbyLocation, setNearbyLocation] = useState<NearbyLocationState>({
    loading: false,
    label: null,
    city: null,
    latitude: null,
    longitude: null,
  })

  const scrollY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isSignedIn === false) router.replace("/")
  }, [isSignedIn])

  const syncFreelancerLocation = async (location: Omit<NearbyLocationState, "loading">) => {
    try {
      if (!user?.id) return
      const token = await getToken()
      if (!token) return

      await fetch(getApiUrl("/api/user/location"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clerkId: user.id,
          label: location.label,
          city: location.city,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      })
    } catch (error) {
      console.warn("[Location] Failed to sync freelancer location", error)
    }
  }

  const loadNearbyLocation = async () => {
    try {
      setNearbyLocation((current) => ({ ...current, loading: true }))
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== "granted") {
        setNearbyLocation({
          loading: false,
          label: null,
          city: null,
          latitude: null,
          longitude: null,
        })
        return
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const [result] = await Location.reverseGeocodeAsync({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      })

      const nextLocation = {
        label:
          result?.city ||
          result?.district ||
          result?.subregion ||
          result?.region ||
          "Your current area",
        city: result?.city || result?.district || result?.subregion || null,
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      }

      setNearbyLocation({
        loading: false,
        ...nextLocation,
      })
      await syncFreelancerLocation(nextLocation)
    } catch (error) {
      console.warn("[Location] Failed to load freelancer area", error)
      setNearbyLocation({
        loading: false,
        label: null,
        city: null,
        latitude: null,
        longitude: null,
      })
    }
  }

  const buildNearbyQuery = () => {
    const params = new URLSearchParams()
    if (nearbyLocation.latitude !== null) params.set("latitude", String(nearbyLocation.latitude))
    if (nearbyLocation.longitude !== null) params.set("longitude", String(nearbyLocation.longitude))
    if (nearbyLocation.city) params.set("city", nearbyLocation.city)
    if (nearbyLocation.label) params.set("label", nearbyLocation.label)
    return params.toString()
  }

  const loadAppliedJobs = async () => {
    try {
      setApplicationRadarLoading(true)
      if (!user?.id) return
      const stored = await AsyncStorage.getItem(`appliedJobs_${user.id}`)
      if (stored) {
        const jobIds = JSON.parse(stored)
        setAppliedJobs(new Set(jobIds))
      }
      try {
        const token = await getToken()
        const response = await fetch(getApiUrl("/api/applications/my"), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.data)) {
            const appliedJobIds = data.data.map((app: any) => String(app.jobId))
            setAppliedJobs(new Set(appliedJobIds))
            setApplicationRadar(data.data.slice(0, 6))
            await AsyncStorage.setItem(`appliedJobs_${user.id}`, JSON.stringify(appliedJobIds))
          } else {
            setApplicationRadar([])
          }
        } else {
          setApplicationRadar([])
        }
      } catch (apiError) {
        console.warn("[Apply] Could not fetch applications from API:", apiError)
        setApplicationRadar([])
      }
    } catch (e) {
      console.error("Error loading applied jobs", e)
    } finally {
      setApplicationRadarLoading(false)
    }
  }

  const fetchUserSkills = async () => {
    try {
      if (!user?.id) return
      const response = await fetchAPI<{ user?: { skills?: string | null } }>(`/api/user/get?clerkId=${user.id}`)
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
      const nearbyQuery = buildNearbyQuery()
      const response = await fetch(getApiUrl(`/api/jobs${nearbyQuery ? `?${nearbyQuery}` : ""}`))
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
            location: job.location?.label || job.location?.city || job.specialistChoice || "Remote",
            createdAt: job.createdAt || new Date().toISOString(),
            clientName: job.userName || "Anonymous Client",
            clientAvatar: job.userAvatar || null,
            clientRating: 4.5,
            isMatch: userSkills && category.toLowerCase().includes(userSkills.toLowerCase()),
            inYourArea: Boolean(job.proximity?.inYourArea),
            distanceKm: typeof job.proximity?.distanceKm === "number" ? job.proximity.distanceKm : null,
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
      const nearbyQuery = buildNearbyQuery()
      const response = await fetch(
        getApiUrl(`/api/jobs/search?q=${encodeURIComponent(query)}${nearbyQuery ? `&${nearbyQuery}` : ""}`)
      )
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
            location: job.location?.label || job.location?.city || job.specialistChoice || "Remote",
            createdAt: job.createdAt || new Date().toISOString(),
            clientName: job.userName || "Anonymous Client",
            clientAvatar: job.userAvatar || null,
            clientRating: 4.5,
            isMatch: userSkills && category.toLowerCase().includes(userSkills.toLowerCase()),
            inYourArea: Boolean(job.proximity?.inYourArea),
            distanceKm: typeof job.proximity?.distanceKm === "number" ? job.proximity.distanceKm : null,
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
      void loadNearbyLocation()
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchJobs()
    }
  }, [nearbyLocation.latitude, nearbyLocation.longitude, nearbyLocation.city, user?.id])

  useEffect(() => {
    if (userSkills && jobs.length) searchJobs(userSkills)
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
      const token = await getToken()
      const response = await fetch(getApiUrl(`/api/jobs/${selectedJob.id}/apply`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          jobId: selectedJob.id,
          userName: user.fullName || user.firstName || "Freelancer",
          userEmail: user.primaryEmailAddress?.emailAddress,
          quotation: applicationData.quotation,
          conditions: applicationData.conditions,
        }),
      })
      let data
      try { data = await response.json() } catch (parseError) {
        console.error("Failed to parse response:", parseError)
        throw new Error("Server error. Please contact support or try again later.")
      }
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to apply")
      setAppliedJobs((s) => {
        const updated = new Set(s).add(selectedJob.id)
        AsyncStorage.setItem(`appliedJobs_${user.id}`, JSON.stringify(Array.from(updated)))
          .catch((err) => console.warn("Failed to save to storage:", err))
        return updated
      })
      await loadAppliedJobs()
      const message = data.alreadyApplied ? "You've already applied to this job" : "The client has been notified"
      Toast.show({ type: "success", text1: data.alreadyApplied ? "Already applied" : "Applied successfully", text2: message, position: "bottom", visibilityTime: 3000, autoHide: true })
      if (data.conversation?.conversationId) {
        router.push({
          pathname: "/(root)/chat",
          params: {
            conversationId: data.conversation.conversationId,
            otherClerkId: data.conversation.otherClerkId,
            otherDisplayName: data.conversation.otherDisplayName,
            jobTitle: data.conversation.jobTitle || selectedJob.title,
          },
        })
      }
    } catch (error) {
      console.error("Apply error:", error)
      Toast.show({ type: "error", text1: "Application failed", text2: error instanceof Error ? error.message : "Please try again", position: "bottom", visibilityTime: 3000, autoHide: true })
    } finally {
      setApplyingJobs((s) => { const next = new Set(s); next.delete(selectedJob.id); return next })
    }
  }

  const openApplicationConversation = (application: ApplicationRadarItem) => {
    if (!application.conversationId) return

    router.push({
      pathname: "/(root)/chat",
      params: {
        conversationId: application.conversationId,
        otherDisplayName: application.job?.clientName || "Client",
        jobTitle: application.job?.serviceType || "Application Chat",
      },
    })
  }

  const timeAgo = (date: string) => {
    const diffMs    = Date.now() - new Date(date).getTime()
    const diffMins  = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffMins < 1)  return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const filters = ["All", "In your Area", "Matched", "High Budget"]

  const getFilteredJobs = () => {
    switch (activeFilter) {
      case "In your Area": return jobs.filter((job) => job.inYourArea)
      case "Matched":     return jobs.filter((j) => j.isMatch)
      case "High Budget": return [...jobs].sort((a, b) => b.budget - a.budget)
      default:            return jobs
    }
  }

  /* ─────────────────── Job Card — Premium Redesign ─────────────────── */
  const renderJobCard = ({ item }: { item: Job }) => {
    const isApplied  = appliedJobs.has(item.id)
    const isApplying = applyingJobs.has(item.id)
    const tags       = item.category.split(",").slice(0, 3)
    const displayTags = item.inYourArea ? ["In your Area", ...tags] : tags

    return (
      <TouchableOpacity
        activeOpacity={0.97}
        style={{
          backgroundColor: C.cloud,
          borderRadius: 20,
          marginBottom: 14,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: item.isMatch ? `${C.fern}28` : "rgba(0,0,0,0.055)",
          ...shadow.lifted,
        }}
      >
        {/* Match accent — refined hairline with gradient feel */}
        {item.isMatch && (
          <View style={{
            height: 2,
            backgroundColor: C.fern,
            opacity: 0.7,
          }} />
        )}

        <View style={{ padding: 22 }}>

          {/* ── Top row: Avatar + Client + Time ── */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>

            {/* Avatar — square with refined radius */}
            <View style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: item.isMatch ? C.mint : C.fog,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: item.isMatch ? `${C.fern}30` : "rgba(0,0,0,0.04)",
            }}>
              {item.clientAvatar ? (
                <Image source={{ uri: item.clientAvatar }} style={{ width: 42, height: 42 }} resizeMode="cover" />
              ) : (
                <Text style={{
                  fontFamily: "Quicksand-Bold",
                  fontSize: 16,
                  color: item.isMatch ? C.forest : C.stone,
                  letterSpacing: -0.3,
                }}>
                  {item.clientName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: "Quicksand-Bold",
                fontSize: 13,
                color: C.ink,
                letterSpacing: -0.1,
                marginBottom: 3,
              }}>
                {item.clientName}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 11.5, color: C.pebble }}>
                  📍 {item.location}{item.distanceKm !== null ? ` · ${item.distanceKm} km` : ""}
                </Text>
                <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: C.pebble, opacity: 0.5 }} />
                <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 11.5, color: C.pebble }}>
                  {timeAgo(item.createdAt)}
                </Text>
              </View>
            </View>

            {/* Match badge — pill, refined */}
            {item.inYourArea ? (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                backgroundColor: `${C.green}14`,
                borderWidth: 1,
                borderColor: `${C.green}28`,
              }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.green }} />
                <Text style={{
                  fontFamily: "Quicksand-Bold",
                  fontSize: 9.5,
                  letterSpacing: 0.8,
                  color: C.green,
                  textTransform: "uppercase",
                }}>
                  In your area
                </Text>
              </View>
            ) : item.isMatch && (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                backgroundColor: `${C.fern}14`,
                borderWidth: 1,
                borderColor: `${C.fern}28`,
              }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.fern }} />
                <Text style={{
                  fontFamily: "Quicksand-Bold",
                  fontSize: 9.5,
                  letterSpacing: 0.8,
                  color: C.forest,
                  textTransform: "uppercase",
                }}>
                  Match
                </Text>
              </View>
            )}
          </View>

          {/* ── Job Title — editorial weight ── */}
          <Text style={{
            fontFamily: "Quicksand-Bold",
            fontSize: 19,
            color: C.ink,
            letterSpacing: -0.7,
            lineHeight: 26,
            marginBottom: 9,
          }}>
            {item.title}
          </Text>

          {/* ── Description ── */}
          <Text
            numberOfLines={2}
            style={{
              fontFamily: "Quicksand-Medium",
              fontSize: 13.5,
              lineHeight: 21,
              color: C.stone,
              letterSpacing: 0.05,
              marginBottom: 16,
            }}
          >
            {item.description}
          </Text>

          {/* ── Tags — refined pills ── */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            {displayTags.map((tag, i) => (
              <View
                key={i}
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor:
                    tag === "In your Area"
                      ? C.greenLight
                      : i === 0 && item.isMatch
                        ? C.mint
                        : C.mist,
                  borderWidth: 1,
                  borderColor:
                    tag === "In your Area"
                      ? `${C.green}25`
                      : i === 0 && item.isMatch
                        ? `${C.fern}22`
                        : "transparent",
                }}
              >
                <Text style={{
                  fontFamily: "Quicksand-SemiBold",
                  fontSize: 11,
                  letterSpacing: 0.15,
                  color:
                    tag === "In your Area"
                      ? C.green
                      : i === 0 && item.isMatch
                        ? C.forest
                        : C.stone,
                }}>
                  {tag.trim()}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Divider ── */}
          <View style={{ height: 1, backgroundColor: C.fog, marginBottom: 18 }} />

          {/* ── Budget + Apply ── */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>

            {/* Budget block */}
            <View>
              <Text style={{
                fontFamily: "Quicksand-Bold",
                fontSize: 9.5,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: C.pebble,
                marginBottom: 4,
              }}>
                Budget
              </Text>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Text style={{
                  fontFamily: "Quicksand-Bold",
                  fontSize: 13,
                  color: C.moss,
                  marginTop: 4,
                  marginRight: 1,
                }}>$</Text>
                <Text style={{
                  fontFamily: "Quicksand-Bold",
                  fontSize: 34,
                  color: C.ink,
                  letterSpacing: -1.8,
                  lineHeight: 38,
                }}>
                  {item.budget}
                </Text>
              </View>
            </View>

            {/* Apply button — premium feel */}
            <TouchableOpacity
              onPress={() => handleApply(item)}
              disabled={isApplied || isApplying}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                paddingHorizontal: isApplied ? 18 : 24,
                paddingVertical: 13,
                borderRadius: 14,
                backgroundColor: isApplied ? C.mint : C.forest,
                borderWidth: isApplied ? 1.5 : 0,
                borderColor: isApplied ? `${C.fern}40` : "transparent",
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
                      <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 10, color: C.cloud }}>✓</Text>
                    </View>
                  )}
                  <Text style={{
                    fontFamily: "Quicksand-Bold",
                    fontSize: 13.5,
                    letterSpacing: 0.15,
                    color: isApplied ? C.forest : C.cloud,
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

  /* ─────────────────── Stats Card — Premium Redesign ─────────────────── */
  const StatsCard = () => (
    <View style={{
      borderRadius: 28,
      marginBottom: 14,
      overflow: "hidden",
      backgroundColor: C.charcoal,
      borderWidth: 1,
      borderColor: `${C.forest}55`,
      ...shadow.dark,
    }}>
      {/* Top accent bar */}
      <View style={{ height: 2, backgroundColor: C.fern, opacity: 0.75 }} />

      <View style={{ padding: 26 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 30 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.fern }} />
            <Text style={{
              fontFamily: "Quicksand-Bold",
              fontSize: 17,
              letterSpacing: -0.5,
              color: C.cloud,
            }}>
              Overview
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ fontFamily: "Quicksand-SemiBold", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {/* Earnings */}
        <Text style={{
          fontFamily: "Quicksand-Bold",
          fontSize: 10,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: C.pebble,
          marginBottom: 10,
        }}>
          Total Earnings
        </Text>

        {/* Large number — split whole/decimal for visual hierarchy */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 12 }}>
          <Text style={{
            fontFamily: "Quicksand-Bold",
            fontSize: 52,
            letterSpacing: -3,
            lineHeight: 52,
            color: C.cloud,
          }}>
            $9,787
          </Text>
          <Text style={{
            fontFamily: "Quicksand-Bold",
            fontSize: 32,
            letterSpacing: -1.5,
            lineHeight: 44,
            color: `${C.sage}45`,
          }}>
            .32
          </Text>
        </View>

        {/* Growth tag */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <View style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
            backgroundColor: `${C.fern}20`,
            borderWidth: 1,
            borderColor: `${C.fern}28`,
          }}>
            <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 12, color: C.leaf }}>+$2,456.12</Text>
          </View>
          <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 13, color: "rgba(255,255,255,0.22)" }}>
            this month
          </Text>
        </View>

        {/* Stat tiles */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {[
            { value: "36", label: "Projects", sub: "5 this month", dot: C.fern },
            { value: "10", label: "Clients",  sub: "3 this month", dot: C.sage },
          ].map((stat, i) => (
            <View key={i} style={{
              flex: 1,
              borderRadius: 18,
              padding: 18,
              backgroundColor: "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
            }}>
              <Text style={{
                fontFamily: "Quicksand-Bold",
                fontSize: 36,
                letterSpacing: -2,
                lineHeight: 40,
                color: C.cloud,
                marginBottom: 4,
              }}>
                {stat.value}
              </Text>
              <Text style={{
                fontFamily: "Quicksand-SemiBold",
                fontSize: 13,
                color: "rgba(255,255,255,0.38)",
              }}>
                {stat.label}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 5 }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: stat.dot }} />
                <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                  {stat.sub}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ranking tile — gold accent */}
        <View style={{
          borderRadius: 18,
          padding: 18,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: C.goldLight,
          borderWidth: 1,
          borderColor: `${C.gold}22`,
          marginBottom: 22,
        }}>
          <View>
            <Text style={{
              fontFamily: "Quicksand-Bold",
              fontSize: 22,
              letterSpacing: -0.6,
              color: C.ink,
            }}>
              5th place
            </Text>
            <Text style={{
              fontFamily: "Quicksand-Medium",
              fontSize: 13,
              color: "#9A8A6A",
              marginTop: 2,
            }}>
              Top-hire freelancers
            </Text>
          </View>
          <View style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FDF0CC",
            borderWidth: 1,
            borderColor: `${C.gold}28`,
          }}>
            <Text style={{ fontSize: 26 }}>🏆</Text>
          </View>
        </View>

        {/* Availability bar */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 13, color: C.cloud }}>Availability</Text>
          <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
            100h / month
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 2 }}>
          {[...Array(30)].map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 28,
                borderRadius: 4,
                backgroundColor: i < 22
                  ? `rgba(82, 131, 155, ${0.15 + (i / 30) * 0.85})`
                  : "rgba(255,255,255,0.05)",
              }}
            />
          ))}
        </View>

      </View>
    </View>
  )

  /* ─────────────────── CTA Card — Premium Redesign ─────────────────── */
  const CTACard = () => (
    <View style={{
      borderRadius: 28,
      marginBottom: 14,
      overflow: "hidden",
      backgroundColor: C.forest,
      ...shadow.dark,
    }}>
      {/* Decorative blobs */}
      <View style={{
        position: "absolute",
        width: 160,
        height: 160,
        borderRadius: 80,
        top: -55,
        right: -55,
        backgroundColor: `${C.fern}18`,
      }} />
      <View style={{
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        bottom: -30,
        left: -30,
        backgroundColor: `${C.leaf}12`,
      }} />

      {/* Hero image — flush, full width */}
      <Image
        source={require("@/assets/images/empty-jobs.jpg")}
        style={{ width: "100%", height: 200 }}
        resizeMode="cover"
      />

      <View style={{ paddingHorizontal: 28, paddingTop: 28, paddingBottom: 30, alignItems: "center" }}>

        {/* Icon lockup */}
        <View style={{
          width: 60,
          height: 60,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${C.green}2E`,
          borderWidth: 1.5,
          borderColor: `${C.green}50`,
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 27 }}>🔗</Text>
        </View>

        {/* Headline — generous tracking for premium feel */}
        <Text style={{
          fontFamily: "Quicksand-Bold",
          fontSize: 24,
          textAlign: "center",
          letterSpacing: -0.9,
          lineHeight: 31,
          color: C.cloud,
          marginBottom: 12,
        }}>
          Get new clients{"\n"}2× faster
        </Text>

        <Text style={{
          fontFamily: "Quicksand-Medium",
          fontSize: 14,
          textAlign: "center",
          lineHeight: 22,
          color: `${C.sage}C0`,
          paddingHorizontal: 8,
          marginBottom: 26,
        }}>
          Join us today and unlock opportunities to land new clients twice as fast!
        </Text>

        {/* CTA button — full-width, elevated green */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={{
            paddingVertical: 15,
            paddingHorizontal: 32,
            borderRadius: 14,
            width: "100%",
            alignItems: "center",
            backgroundColor: C.green,
            ...shadow.btnGreen,
          }}
        >
          <Text style={{
            fontFamily: "Quicksand-Bold",
            fontSize: 15,
            letterSpacing: 0.3,
            color: C.cloud,
          }}>
            Join now →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  /* ─────────────────── Income Card — Premium Redesign ─────────────────── */
  const IncomeCard = () => (
    <View style={{
      backgroundColor: C.cloud,
      borderRadius: 28,
      padding: 24,
      borderWidth: 1.5,
      borderColor: C.fog,
      ...shadow.card,
    }}>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <Text style={{
          fontFamily: "Quicksand-Bold",
          fontSize: 17,
          letterSpacing: -0.5,
          color: C.ink,
        }}>
          Income
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 10,
            backgroundColor: C.fog,
          }}
        >
          <Text style={{ fontFamily: "Quicksand-SemiBold", fontSize: 12, color: C.stone }}>Monthly</Text>
        </TouchableOpacity>
      </View>

      {/* April block */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 13, letterSpacing: 0.2, color: C.pebble }}>April</Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, backgroundColor: `${C.fern}18` }}>
            <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 11, color: C.forest }}>+18%</Text>
          </View>
        </View>
        <Text style={{
          fontFamily: "Quicksand-Bold",
          fontSize: 32,
          letterSpacing: -1.4,
          color: C.ink,
          marginBottom: 14,
        }}>
          $2,167.56
        </Text>

        {/* Segmented bar */}
        <View style={{ flexDirection: "row", gap: 3, height: 9, borderRadius: 8, overflow: "hidden" }}>
          <View style={{ borderRadius: 8, width: "30%", backgroundColor: C.moss }} />
          <View style={{ borderRadius: 8, width: "25%", backgroundColor: C.fern }} />
          <View style={{ borderRadius: 8, width: "20%", backgroundColor: C.leaf }} />
          <View style={{ borderRadius: 8, width: "15%", backgroundColor: C.sage }} />
        </View>

        {/* Legend */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 13 }}>
          {[
            { color: C.moss, label: "Design" },
            { color: C.fern, label: "Dev" },
            { color: C.leaf, label: "Consult" },
            { color: C.sage, label: "Other" },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: item.color }} />
              <Text style={{ fontFamily: "Quicksand-SemiBold", fontSize: 11, color: C.pebble }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: C.fog, marginBottom: 22 }} />

      {/* March block */}
      <View>
        <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 13, letterSpacing: 0.2, color: C.pebble, marginBottom: 6 }}>
          March
        </Text>
        <Text style={{
          fontFamily: "Quicksand-Bold",
          fontSize: 32,
          letterSpacing: -1.4,
          color: C.ink,
          marginBottom: 14,
        }}>
          $1,367.50
        </Text>
        <View style={{ flexDirection: "row", gap: 3, height: 9, borderRadius: 8, overflow: "hidden" }}>
          <View style={{ borderRadius: 8, width: "20%", backgroundColor: C.moss }} />
          <View style={{ borderRadius: 8, width: "40%", backgroundColor: C.fern }} />
          <View style={{ borderRadius: 8, width: "30%", backgroundColor: C.leaf }} />
          <View style={{ borderRadius: 8, width: "5%",  backgroundColor: C.sage }} />
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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.forest,
          marginBottom: 18,
          ...shadow.btn,
        }}>
          <ActivityIndicator size="small" color={C.cloud} />
        </View>
        <Text style={{
          fontFamily: "Quicksand-SemiBold",
          fontSize: 14,
          letterSpacing: -0.2,
          color: C.pebble,
        }}>
          Loading jobs...
        </Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={fetchJobs} tintColor={C.forest} colors={[C.forest]} />
        }
        contentContainerStyle={{ paddingBottom: 52 }}
      >

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 4 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>

            <View style={{ flex: 1 }}>
              {/* Eyebrow label */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.fern }} />
                <Text style={{
                  fontFamily: "Quicksand-SemiBold",
                  fontSize: 13,
                  letterSpacing: 0.2,
                  color: C.pebble,
                }}>
                  Welcome back
                </Text>
              </View>
              {/* Name — large editorial greeting */}
              <Text style={{
                fontFamily: "Quicksand-Bold",
                fontSize: 34,
                letterSpacing: -1.8,
                lineHeight: 38,
                color: C.ink,
              }}>
                {user?.firstName || "Freelancer"} 👋
              </Text>
            </View>

            {/* Notification bell — refined container */}
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

          {/* ── Search bar — elevated white card ── */}
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
            <Text style={{ fontSize: 15, marginRight: 10 }}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={(t) => { setSearchQuery(t); searchJobs(t) }}
              placeholder="Search jobs or skills..."
              placeholderTextColor={C.pebble}
              style={{
                fontFamily: "Quicksand-Medium",
                flex: 1,
                fontSize: 14,
                color: C.ink,
              }}
            />
            {isSearching && <ActivityIndicator size="small" color={C.fern} />}
          </View>
        </View>

        {/* ── Content ── */}
        <View style={{ paddingHorizontal: 22, paddingTop: 28 }}>

          {/* Section header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{
              fontFamily: "Quicksand-Bold",
              fontSize: 22,
              letterSpacing: -0.9,
              color: C.ink,
            }}>
              Available Jobs
            </Text>
            {/* Count badge */}
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: C.forest,
            }}>
              <Text style={{
                fontFamily: "Quicksand-Bold",
                fontSize: 12,
                letterSpacing: 0.3,
                color: C.cloud,
              }}>
                {filteredJobs.length}
              </Text>
            </View>
          </View>

          {/* ── Filter chips — refined ── */}
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
                    paddingVertical: 9,
                    borderRadius: 11,
                    borderWidth: 1.5,
                    backgroundColor: isActive ? C.forest : C.cloud,
                    borderColor: isActive ? C.forest : C.fog,
                    ...(!isActive ? shadow.sm : {}),
                  }}
                >
                  <Text style={{
                    fontFamily: "Quicksand-Bold",
                    fontSize: 13,
                    letterSpacing: 0.1,
                    color: isActive ? C.cloud : C.stone,
                  }}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <ApplicationRadar
            applications={applicationRadar}
            loading={applicationRadarLoading}
            onOpenChat={openApplicationConversation}
          />

          {/* ── Jobs list ── */}
          {filteredJobs.length === 0 ? (
            <View style={{
              backgroundColor: C.cloud,
              borderRadius: 28,
              overflow: "hidden",
              borderWidth: 1.5,
              borderColor: C.fog,
              ...shadow.sm,
            }}>
              <Image
                source={require("@/assets/images/empty-jobs.jpg")}
                style={{ width: "100%", height: 240 }}
                resizeMode="cover"
              />
              <View style={{ paddingHorizontal: 28, paddingVertical: 22, alignItems: "center" }}>
                <Text style={{
                  fontFamily: "Quicksand-Bold",
                  fontSize: 17,
                  textAlign: "center",
                  letterSpacing: -0.4,
                  color: C.ink,
                  marginBottom: 6,
                }}>
                  No jobs found
                </Text>
                <Text style={{
                  fontFamily: "Quicksand-Medium",
                  fontSize: 14,
                  textAlign: "center",
                  lineHeight: 22,
                  color: C.pebble,
                }}>
                  Try adjusting your search or filters.
                </Text>
              </View>
            </View>
          ) : (
            filteredJobs.map((job) => <View key={job.id}>{renderJobCard({ item: job })}</View>)
          )}

          {/* ── Section divider ── */}
          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 32, gap: 14 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: C.fog }} />
            <Text style={{
              fontFamily: "Quicksand-Bold",
              fontSize: 9.5,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: C.pebble,
            }}>
              Your Dashboard
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: C.fog }} />
          </View>

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
