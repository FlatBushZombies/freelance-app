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
  // Primary green for CTA
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
    if (isSignedIn === false) router.replace("/")
  }, [isSignedIn])

  const loadAppliedJobs = async () => {
    try {
      if (!user?.id) return
      const stored = await AsyncStorage.getItem(`appliedJobs_${user.id}`)
      if (stored) {
        const jobIds = JSON.parse(stored)
        setAppliedJobs(new Set(jobIds))
      }
      try {
        const token = await user.getIdToken()
        const response = await fetch(`https://quickhands-api.vercel.app/api/applications/my`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.data)) {
            const appliedJobIds = data.data.map((app: any) => String(app.jobId))
            setAppliedJobs(new Set(appliedJobIds))
            await AsyncStorage.setItem(`appliedJobs_${user.id}`, JSON.stringify(appliedJobIds))
          }
        }
      } catch (apiError) {
        console.warn("[Apply] Could not fetch applications from API:", apiError)
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
      const response = await fetch(`https://quickhands-api.vercel.app/api/jobs/${selectedJob.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    const diffMs    = Date.now() - new Date(date).getTime()
    const diffMins  = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffMins < 1)  return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const filters = ["All", "Matched", "Recent", "High Budget"]

  const getFilteredJobs = () => {
    switch (activeFilter) {
      case "Matched":     return jobs.filter((j) => j.isMatch)
      case "Recent":      return [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case "High Budget": return [...jobs].sort((a, b) => b.budget - a.budget)
      default:            return jobs
    }
  }

  /* ─────────────────── Job Card ─────────────────── */
  const renderJobCard = ({ item }: { item: Job }) => {
    const isApplied  = appliedJobs.has(item.id)
    const isApplying = applyingJobs.has(item.id)
    const tags       = item.category.split(",").slice(0, 3)

    return (
      <TouchableOpacity
        activeOpacity={0.96}
        className="bg-white rounded-[22px] mb-4 overflow-hidden"
        style={{ borderWidth: 1.5, borderColor: item.isMatch ? `${C.fern}30` : C.fog, ...shadow.card }}
      >
        {item.isMatch && <View className="h-[3px] w-full" style={{ backgroundColor: C.fern }} />}

        <View className="p-5">
          {/* Row 1: Avatar + meta + badge + time */}
          <View className="flex-row items-center mb-4">
            <View
              className="w-11 h-11 rounded-[14px] items-center justify-center mr-3 overflow-hidden"
              style={{ backgroundColor: item.isMatch ? C.mint : C.fog, borderWidth: 1.5, borderColor: item.isMatch ? `${C.fern}40` : C.fog }}
            >
              {item.clientAvatar ? (
                <Image source={{ uri: item.clientAvatar }} style={{ width: 44, height: 44 }} resizeMode="cover" />
              ) : (
                <Text className="font-quicksand-bold text-[15px] tracking-[-0.3px]" style={{ color: item.isMatch ? C.forest : C.stone }}>
                  {item.clientName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            <View className="flex-1">
              <Text className="font-quicksand-bold text-[13px] tracking-[-0.1px]" style={{ color: C.ink }}>
                {item.clientName}
              </Text>
              <View className="flex-row items-center mt-[3px] gap-1.5">
                <Text className="font-quicksand text-[11px]" style={{ color: C.pebble }}>📍 {item.location}</Text>
                <View className="w-[2px] h-[2px] rounded-full" style={{ backgroundColor: C.pebble }} />
                <Text className="font-quicksand text-[11px]" style={{ color: C.pebble }}>{timeAgo(item.createdAt)}</Text>
              </View>
            </View>

            {item.isMatch && (
              <View className="flex-row items-center gap-1 px-2.5 py-[5px] rounded-full border" style={{ backgroundColor: `${C.fern}18`, borderColor: `${C.fern}30` }}>
                <View className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: C.fern }} />
                <Text className="font-quicksand-bold text-[10px] tracking-[0.4px]" style={{ color: C.forest }}>MATCH</Text>
              </View>
            )}
          </View>

          <Text className="font-quicksand-bold text-[18px] mb-2 leading-[25px] tracking-[-0.5px]" style={{ color: C.ink }}>
            {item.title}
          </Text>

          <Text numberOfLines={2} className="font-quicksand text-sm leading-[22px] mb-4 tracking-[0.1px]" style={{ color: C.stone }}>
            {item.description}
          </Text>

          {/* Tags */}
          <View className="flex-row flex-wrap gap-1.5 mb-[18px]">
            {tags.map((tag, i) => (
              <View
                key={i}
                className="px-3 py-1.5 rounded-lg border"
                style={{ backgroundColor: i === 0 && item.isMatch ? C.mint : C.fog, borderColor: i === 0 && item.isMatch ? `${C.fern}25` : "rgba(0,0,0,0.03)" }}
              >
                <Text className="font-quicksand-semibold text-[11px] tracking-[0.2px]" style={{ color: i === 0 && item.isMatch ? C.forest : C.stone }}>
                  {tag.trim()}
                </Text>
              </View>
            ))}
          </View>

          {/* Budget + Apply */}
          <View className="flex-row items-center justify-between pt-4" style={{ borderTopWidth: 1, borderTopColor: C.fog }}>
            <View>
              <Text className="font-quicksand-bold text-[10px] tracking-[1.2px] uppercase mb-1" style={{ color: C.pebble }}>Budget</Text>
              <View className="flex-row items-baseline gap-[1px]">
                <Text className="font-quicksand-bold text-[13px] mb-0.5" style={{ color: C.moss }}>$</Text>
                <Text className="font-quicksand-bold text-[28px] tracking-[-1.2px]" style={{ color: C.ink }}>{item.budget}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleApply(item)}
              disabled={isApplied || isApplying}
              activeOpacity={0.82}
              className="flex-row items-center gap-[7px] rounded-[14px]"
              style={{ paddingHorizontal: isApplied ? 18 : 26, paddingVertical: 14, backgroundColor: isApplied ? C.mint : C.forest, borderWidth: isApplied ? 1.5 : 0, borderColor: isApplied ? `${C.fern}40` : "transparent", ...(isApplied ? {} : shadow.btn) }}
            >
              {isApplying ? (
                <ActivityIndicator size="small" color={isApplied ? C.forest : C.cloud} />
              ) : (
                <>
                  {isApplied && (
                    <View className="w-[18px] h-[18px] rounded-full items-center justify-center" style={{ backgroundColor: C.fern }}>
                      <Text className="font-quicksand-bold text-[10px]" style={{ color: C.cloud }}>✓</Text>
                    </View>
                  )}
                  <Text className="font-quicksand-bold text-sm tracking-[0.2px]" style={{ color: isApplied ? C.forest : C.cloud }}>
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
    <View className="rounded-[28px] p-[26px] mb-3.5 overflow-hidden border" style={{ backgroundColor: C.charcoal, borderColor: `${C.forest}60`, ...shadow.dark }}>
      <View className="absolute left-8 right-8 h-[2px] rounded-b-sm opacity-80" style={{ top: 0, backgroundColor: C.fern }} />

      <View className="flex-row items-center justify-between mb-7">
        <View className="flex-row items-center gap-[9px]">
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: C.fern }} />
          <Text className="font-quicksand-bold text-[17px] tracking-[-0.4px]" style={{ color: C.cloud }}>Overview</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} className="px-3.5 py-[7px] rounded-[10px] border" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)" }}>
          <Text className="font-quicksand-semibold text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>All Time</Text>
        </TouchableOpacity>
      </View>

      <Text className="font-quicksand-bold text-[10px] tracking-[1.8px] uppercase mb-2.5" style={{ color: C.pebble }}>Total Earnings</Text>
      <Text className="font-quicksand-bold text-[44px] mb-2.5 tracking-[-2.5px]" style={{ color: C.cloud }}>
        $9,787<Text className="font-quicksand-bold text-[30px]" style={{ color: `${C.sage}50` }}>.32</Text>
      </Text>

      <View className="flex-row items-center gap-2.5 mb-8">
        <View className="px-2.5 py-1 rounded-lg border" style={{ backgroundColor: `${C.fern}22`, borderColor: `${C.fern}30` }}>
          <Text className="font-quicksand-bold text-xs" style={{ color: C.leaf }}>+$2,456.12</Text>
        </View>
        <Text className="font-quicksand-medium text-[13px]" style={{ color: "rgba(255,255,255,0.25)" }}>this month</Text>
      </View>

      <View className="flex-row gap-2.5 mb-4">
        {[
          { value: "36", label: "Projects", sub: "5 this month", dot: C.fern },
          { value: "10", label: "Clients",  sub: "3 this month", dot: C.sage },
        ].map((stat, i) => (
          <View key={i} className="flex-1 rounded-[18px] p-5 border" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.06)" }}>
            <Text className="font-quicksand-bold text-[32px] mb-[5px] tracking-[-1.5px]" style={{ color: C.cloud }}>{stat.value}</Text>
            <Text className="font-quicksand-semibold text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</Text>
            <View className="flex-row items-center mt-2.5 gap-[5px]">
              <View className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: stat.dot }} />
              <Text className="font-quicksand text-[11px]" style={{ color: "rgba(255,255,255,0.22)" }}>{stat.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="rounded-[18px] p-5 flex-row items-center justify-between mb-5 border" style={{ backgroundColor: C.goldLight, borderColor: `${C.gold}25` }}>
        <View>
          <Text className="font-quicksand-bold text-[22px] tracking-[-0.6px]" style={{ color: C.ink }}>5th place</Text>
          <Text className="font-quicksand-medium text-[13px] mt-[3px]" style={{ color: "#9A8A6A" }}>Top-hire freelancers</Text>
        </View>
        <View className="w-[52px] h-[52px] rounded-[18px] items-center justify-center border" style={{ backgroundColor: "#FDF0CC", borderColor: `${C.gold}30` }}>
          <Text className="text-[26px]">🏆</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-quicksand-bold text-[13px]" style={{ color: C.cloud }}>Availability</Text>
        <Text className="font-quicksand-medium text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>100h / month</Text>
      </View>
      <View className="flex-row gap-0.5">
        {[...Array(30)].map((_, i) => (
          <View key={i} className="flex-1 h-7 rounded-[4px]" style={{ backgroundColor: i < 22 ? `rgba(82, 131, 155, ${0.15 + (i / 30) * 0.85})` : "rgba(255,255,255,0.05)" }} />
        ))}
      </View>
    </View>
  )

  /* ─────────────────── CTA Card ─────────────────── */
  const CTACard = () => (
    <View className="rounded-[28px] mb-3.5 overflow-hidden" style={{ backgroundColor: C.forest, ...shadow.dark }}>
      {/* Decorative blobs */}
      <View className="absolute w-40 h-40 rounded-full" style={{ top: -50, right: -50, backgroundColor: `${C.fern}18` }} />
      <View className="absolute w-[120px] h-[120px] rounded-full" style={{ bottom: -30, left: -30, backgroundColor: `${C.leaf}12` }} />

      {/* Illustration — full-width, no horizontal padding, flush to top */}
      <Image
        source={require("@/assets/images/empty-jobs.jpg")}
        style={{ width: "100%", height: 200 }}
        resizeMode="cover"
      />

      {/* Text content */}
      <View className="px-8 pt-6 pb-8 items-center">
        <View className="w-16 h-16 rounded-[22px] items-center justify-center mb-[22px] border-[1.5px]" style={{ backgroundColor: `${C.green}30`, borderColor: `${C.green}50` }}>
          <Text className="text-[28px]">🔗</Text>
        </View>
        <Text className="font-quicksand-bold text-2xl text-center mb-3 tracking-[-0.8px] leading-[30px]" style={{ color: C.cloud }}>
          Get new clients{"\n"}2× faster
        </Text>
        <Text className="font-quicksand text-sm text-center leading-[22px] px-2.5 mb-7" style={{ color: `${C.sage}CC` }}>
          Join us today and unlock opportunities to land new clients twice as fast!
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          className="py-4 px-8 rounded-[14px] w-full items-center"
          style={{
            backgroundColor: C.green,
            ...shadow.btnGreen,
          }}
        >
          <Text className="font-quicksand-bold text-[15px] tracking-[0.3px]" style={{ color: C.cloud }}>Join now →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  /* ─────────────────── Income Card ─────────────────── */
  const IncomeCard = () => (
    <View className="bg-white rounded-[28px] p-6 border-[1.5px]" style={{ borderColor: C.fog, ...shadow.card }}>
      <View className="flex-row items-center justify-between mb-7">
        <Text className="font-quicksand-bold text-[17px] tracking-[-0.4px]" style={{ color: C.ink }}>Income</Text>
        <TouchableOpacity activeOpacity={0.7} className="px-3.5 py-[7px] rounded-[10px]" style={{ backgroundColor: C.fog }}>
          <Text className="font-quicksand-semibold text-xs" style={{ color: C.stone }}>Monthly</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-7">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="font-quicksand-bold text-[13px] tracking-[0.3px]" style={{ color: C.pebble }}>April</Text>
          <View className="px-2 py-[3px] rounded-md" style={{ backgroundColor: `${C.fern}18` }}>
            <Text className="font-quicksand-bold text-[11px]" style={{ color: C.forest }}>+18%</Text>
          </View>
        </View>
        <Text className="font-quicksand-bold text-[30px] tracking-[-1.2px] mb-3.5" style={{ color: C.ink }}>$2,167.56</Text>
        <View className="flex-row gap-[3px] h-2.5 rounded-md overflow-hidden">
          <View className="rounded-md w-[30%]" style={{ backgroundColor: C.moss }} />
          <View className="rounded-md w-[25%]" style={{ backgroundColor: C.fern }} />
          <View className="rounded-md w-[20%]" style={{ backgroundColor: C.leaf }} />
          <View className="rounded-md w-[15%]" style={{ backgroundColor: C.sage }} />
        </View>
        <View className="flex-row flex-wrap gap-3.5 mt-3.5">
          {[{ color: C.moss, label: "Design" }, { color: C.fern, label: "Dev" }, { color: C.leaf, label: "Consult" }, { color: C.sage, label: "Other" }].map((item, i) => (
            <View key={i} className="flex-row items-center gap-[5px]">
              <View className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: item.color }} />
              <Text className="font-quicksand-semibold text-[11px]" style={{ color: C.pebble }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className="h-px mb-7" style={{ backgroundColor: C.fog }} />

      <View>
        <Text className="font-quicksand-bold text-[13px] tracking-[0.3px] mb-1" style={{ color: C.pebble }}>March</Text>
        <Text className="font-quicksand-bold text-[30px] tracking-[-1.2px] mb-3.5" style={{ color: C.ink }}>$1,367.50</Text>
        <View className="flex-row gap-[3px] h-2.5 rounded-md overflow-hidden">
          <View className="rounded-md w-[20%]" style={{ backgroundColor: C.moss }} />
          <View className="rounded-md w-[40%]" style={{ backgroundColor: C.fern }} />
          <View className="rounded-md w-[30%]" style={{ backgroundColor: C.leaf }} />
          <View className="rounded-md w-[5%]"  style={{ backgroundColor: C.sage }} />
        </View>
      </View>
    </View>
  )

  /* ─────────────────── Loading State ─────────────────── */
  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: C.mist }}>
        <View className="w-[60px] h-[60px] rounded-[20px] items-center justify-center mb-5" style={{ backgroundColor: C.forest, ...shadow.btn }}>
          <ActivityIndicator size="small" color={C.cloud} />
        </View>
        <Text className="font-quicksand-semibold text-sm tracking-[-0.2px]" style={{ color: C.pebble }}>
          Loading jobs...
        </Text>
      </SafeAreaView>
    )
  }

  const filteredJobs = getFilteredJobs()

  /* ─────────────────── Main Render ─────────────────── */
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.mist }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchJobs} tintColor={C.forest} colors={[C.forest]} />}
        contentContainerStyle={{ paddingBottom: 52 }}
      >
        {/* ── Header ── */}
        <View className="px-5 pt-5 pb-2">
          <View className="flex-row justify-between items-start mb-[26px]">
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5 mb-[7px]">
                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C.fern }} />
                <Text className="font-quicksand-semibold text-[13px] tracking-[0.2px]" style={{ color: C.pebble }}>
                  Welcome back
                </Text>
              </View>
              <Text className="font-quicksand-bold text-[32px] tracking-[-1.5px] leading-9" style={{ color: C.ink }}>
                {user?.firstName || "Freelancer"} 👋
              </Text>
            </View>
            {user?.id && (
              <View className="w-11 h-11 rounded-[14px] bg-white items-center justify-center border-[1.5px]" style={{ borderColor: C.fog, ...shadow.sm }}>
                <NotificationBell userId={user.id} />
              </View>
            )}
          </View>

          {/* Search */}
          <View className="bg-white rounded-2xl px-[18px] py-3.5 flex-row items-center border-[1.5px]" style={{ borderColor: C.fog, ...shadow.sm }}>
            <Text className="text-base mr-2.5">🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={(t) => { setSearchQuery(t); searchJobs(t) }}
              placeholder="Search jobs or skills..."
              placeholderTextColor={C.pebble}
              className="font-quicksand-medium flex-1 text-sm"
              style={{ color: C.ink }}
            />
            {isSearching && <ActivityIndicator size="small" color={C.fern} />}
          </View>
        </View>

        {/* ── Content ── */}
        <View className="px-5 pt-[26px]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-quicksand-bold text-[22px] tracking-[-0.8px]" style={{ color: C.ink }}>
              Available Jobs
            </Text>
            <View className="px-3 py-[5px] rounded-full" style={{ backgroundColor: C.forest }}>
              <Text className="font-quicksand-bold text-xs tracking-[0.3px]" style={{ color: C.cloud }}>
                {filteredJobs.length}
              </Text>
            </View>
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 22 }} contentContainerStyle={{ gap: 8 }}>
            {filters.map((filter) => {
              const isActive = activeFilter === filter
              return (
                <TouchableOpacity
                  key={filter}
                  activeOpacity={0.8}
                  onPress={() => setActiveFilter(filter)}
                  className="px-[18px] py-2.5 rounded-xl border-[1.5px]"
                  style={{ backgroundColor: isActive ? C.forest : C.cloud, borderColor: isActive ? C.forest : C.fog, ...(!isActive ? shadow.sm : {}) }}
                >
                  <Text className="font-quicksand-bold text-[13px] tracking-[0.1px]" style={{ color: isActive ? C.cloud : C.stone }}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Jobs list */}
          {filteredJobs.length === 0 ? (
            <View className="bg-white rounded-3xl overflow-hidden border-[1.5px]" style={{ borderColor: C.fog, ...shadow.sm }}>
              <Image
                source={require("@/assets/images/empty-jobs.jpg")}
                style={{ width: "100%", height: 240 }}
                resizeMode="cover"
              />
              <View className="px-8 py-6 items-center">
                <Text className="font-quicksand-bold text-[17px] text-center mb-1.5 tracking-[-0.4px]" style={{ color: C.ink }}>
                  No jobs found
                </Text>
                <Text className="font-quicksand text-sm text-center leading-[22px]" style={{ color: C.pebble }}>
                  Try adjusting your search or filters.
                </Text>
              </View>
            </View>
          ) : (
            filteredJobs.map((job) => <View key={job.id}>{renderJobCard({ item: job })}</View>)
          )}

          {/* Section divider */}
          <View className="flex-row items-center my-[30px] gap-3.5">
            <View className="flex-1 h-px" style={{ backgroundColor: C.fog }} />
            <Text className="font-quicksand-bold text-[10px] tracking-[1.8px] uppercase" style={{ color: C.pebble }}>
              Your Dashboard
            </Text>
            <View className="flex-1 h-px" style={{ backgroundColor: C.fog }} />
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