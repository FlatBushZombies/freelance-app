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
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react"
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
  selectedServices: string[]
  location: string
  createdAt: string
  clientName: string
  clientAvatar: string | null
  clientRating: number
  clientReviewCount: number
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

const QUICK_FILTERS = ["All", "Nearby", "Matched", "Top Rated", "High Budget"]
const SERVICE_FILTERS = ["All", "Plumbing", "Electrical", "Cleaning", "Painting", "Repair"]
const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "distance", label: "Closest" },
  { key: "budget_high", label: "Budget high" },
  { key: "client_rating", label: "Best clients" },
]

function timeAgo(date: string) {
  const diffMs = Date.now() - new Date(date).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

function joinMeta(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(" · ")
}

const Home = () => {
  const { user, isSignedIn } = useUser()
  const { getToken } = useAuth()

  const [jobs, setJobs] = useState<Job[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [hasLoadedJobs, setHasLoadedJobs] = useState(false)
  const [isFilterRefreshing, setIsFilterRefreshing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userSkills, setUserSkills] = useState("")
  const [activeQuickFilter, setActiveQuickFilter] = useState("All")
  const [selectedService, setSelectedService] = useState("All")
  const [budgetCap, setBudgetCap] = useState("")
  const [minimumClientRating, setMinimumClientRating] = useState("0")
  const [sortBy, setSortBy] = useState("newest")
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
  const [applicationRadar, setApplicationRadar] = useState<ApplicationRadarItem[]>([])
  const [applicationRadarLoading, setApplicationRadarLoading] = useState(true)
  const [applyingJobs, setApplyingJobs] = useState<Set<string>>(new Set())
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [nearbyLocation, setNearbyLocation] = useState<NearbyLocationState>({
    loading: false,
    label: null,
    city: null,
    latitude: null,
    longitude: null,
  })
  const deferredSearchQuery = useDeferredValue(searchQuery)

  useEffect(() => {
    if (isSignedIn === false) {
      router.replace("/")
    }
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

  const loadAppliedJobs = async () => {
    try {
      setApplicationRadarLoading(true)
      if (!user?.id) return

      const stored = await AsyncStorage.getItem(`appliedJobs_${user.id}`)
      if (stored) {
        setAppliedJobs(new Set(JSON.parse(stored)))
      }

      const token = await getToken()
      const response = await fetch(getApiUrl("/api/applications/my"), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        setApplicationRadar([])
        return
      }

      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        const appliedJobIds = data.data.map((application: any) => String(application.jobId))
        setAppliedJobs(new Set(appliedJobIds))
        setApplicationRadar(data.data.slice(0, 6))
        await AsyncStorage.setItem(`appliedJobs_${user.id}`, JSON.stringify(appliedJobIds))
      } else {
        setApplicationRadar([])
      }
    } catch (error) {
      console.warn("Failed to load applied jobs", error)
      setApplicationRadar([])
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
      }
    } catch (error) {
      console.warn("Failed to fetch skills", error)
    }
  }

  const buildJobUrl = () => {
    const params = new URLSearchParams()
    const normalizedSearch = deferredSearchQuery.trim()
    const matchedOnly = activeQuickFilter === "Matched"
    const nearbyOnly = activeQuickFilter === "Nearby"
    const effectiveSort =
      activeQuickFilter === "High Budget"
        ? "budget_high"
        : activeQuickFilter === "Top Rated"
        ? "client_rating"
        : sortBy
    const effectiveRating =
      activeQuickFilter === "Top Rated"
        ? Math.max(Number(minimumClientRating || 0), 4)
        : Number(minimumClientRating || 0)

    if (nearbyLocation.latitude !== null) params.set("latitude", String(nearbyLocation.latitude))
    if (nearbyLocation.longitude !== null) params.set("longitude", String(nearbyLocation.longitude))
    if (nearbyLocation.city) params.set("city", nearbyLocation.city)
    if (nearbyLocation.label) params.set("label", nearbyLocation.label)
    if (nearbyOnly) params.set("nearbyOnly", "true")
    if (selectedService !== "All") params.set("selectedServices", selectedService)
    if (budgetCap.trim()) params.set("maxBudget", budgetCap.trim())
    if (effectiveRating > 0) params.set("minimumClientRating", String(effectiveRating))
    if (effectiveSort) params.set("sortBy", effectiveSort)

    if (normalizedSearch) {
      params.set("q", normalizedSearch)
      return getApiUrl(`/api/jobs/search?${params.toString()}`)
    }

    return getApiUrl(`/api/jobs?${params.toString()}`)
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch(buildJobUrl())
      const data = await response.json()

      if (!data.success || !Array.isArray(data.data)) {
        if (!hasLoadedJobs) {
          startTransition(() => {
            setJobs([])
          })
        }
        return
      }

      const mapped = data.data.map((job: any) => {
        const selectedServices = Array.isArray(job.selectedServices) ? job.selectedServices : []
        const category = selectedServices.join(", ") || job.serviceType || "General"
        const clientRating = Number(job.clientReviewSummary?.averageRating || 0)
        const reviewCount = Number(job.clientReviewSummary?.reviewCount || 0)
        const normalizedSkills = userSkills.toLowerCase()
        const matchSource = `${category} ${job.serviceType || ""}`.toLowerCase()

        return {
          id: String(job.id),
          title: job.serviceType || "Untitled Job",
          description: job.additionalInfo || "No description available",
          budget: Number.parseFloat(job.maxPrice) || 0,
          category,
          selectedServices,
          location: job.location?.label || job.location?.city || job.specialistChoice || "Remote",
          createdAt: job.createdAt || new Date().toISOString(),
          clientName: job.userName || "Anonymous Client",
          clientAvatar: job.userAvatar || null,
          clientRating,
          clientReviewCount: reviewCount,
          isMatch: normalizedSkills ? matchSource.includes(normalizedSkills) : false,
          inYourArea: Boolean(job.proximity?.inYourArea),
          distanceKm: typeof job.proximity?.distanceKm === "number" ? job.proximity.distanceKm : null,
        }
      })

      startTransition(() => {
        setJobs(mapped)
      })
    } catch (error) {
      console.error("Fetch jobs error", error)
      if (!hasLoadedJobs) {
        startTransition(() => {
          setJobs([])
        })
      }
    } finally {
      setInitialLoading(false)
      setHasLoadedJobs(true)
      setIsFilterRefreshing(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      void loadNearbyLocation()
      void loadAppliedJobs()
      void fetchUserSkills()
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    if (hasLoadedJobs) {
      setIsFilterRefreshing(true)
    }
    fetchJobs().catch(() => undefined)
  }, [
    user?.id,
    deferredSearchQuery,
    activeQuickFilter,
    selectedService,
    budgetCap,
    minimumClientRating,
    sortBy,
    nearbyLocation.latitude,
    nearbyLocation.longitude,
    nearbyLocation.city,
    userSkills,
  ])

  const displayedJobs = useMemo(() => {
    if (activeQuickFilter === "Matched") {
      return jobs.filter((job) => job.isMatch)
    }
    return jobs
  }, [activeQuickFilter, jobs])

  const nearbyJobsCount = displayedJobs.filter((job) => job.inYourArea).length
  const trustedJobsCount = displayedJobs.filter((job) => job.clientRating >= 4).length

  const handleApply = async (job: Job) => {
    if (!user?.id) {
      Alert.alert("Sign in required")
      return
    }

    if (appliedJobs.has(job.id)) {
      return
    }

    setSelectedJob(job)
    setModalVisible(true)
  }

  const submitApplication = async (applicationData: { quotation: string; conditions: string }) => {
    if (!selectedJob || !user?.id) return

    setApplyingJobs((current) => new Set(current).add(selectedJob.id))

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

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to apply")
      }

      const updatedAppliedJobs = new Set(appliedJobs).add(selectedJob.id)
      setAppliedJobs(updatedAppliedJobs)
      await AsyncStorage.setItem(`appliedJobs_${user.id}`, JSON.stringify(Array.from(updatedAppliedJobs)))
      await loadAppliedJobs()

      Toast.show({
        type: "success",
        text1: data.alreadyApplied ? "Already applied" : "Applied successfully",
        text2: data.alreadyApplied ? "You already applied to this job." : "The client has been notified.",
        position: "bottom",
      })

      setModalVisible(false)

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
      Toast.show({
        type: "error",
        text1: "Application failed",
        text2: error instanceof Error ? error.message : "Please try again",
        position: "bottom",
      })
    } finally {
      setApplyingJobs((current) => {
        const next = new Set(current)
        next.delete(selectedJob.id)
        return next
      })
    }
  }

  const openApplicationConversation = (application: ApplicationRadarItem) => {
    if (!application.conversationId) {
      return
    }

    router.push({
      pathname: "/(root)/chat",
      params: {
        conversationId: application.conversationId,
        otherDisplayName: application.job?.clientName || "Client",
        jobTitle: application.job?.serviceType || "Coordination board",
      },
    })
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchJobs().catch(() => undefined)
    loadAppliedJobs().catch(() => undefined)
  }

  if (initialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F5F7]">
        <View className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator size="large" color="#2D4A6A" />
          <Text className="text-sm text-slate-500">Loading jobs...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F5F7]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 42 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D4A6A" />}
      >
        <View className="mb-5 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-semibold uppercase tracking-[1px] text-slate-400">
              Discovery
            </Text>
            <Text className="mt-2 text-3xl font-bold text-slate-950">
              {user?.firstName || "Freelancer"}
            </Text>
            <Text className="mt-2 text-sm leading-6 text-slate-500">
              A calm feed of nearby, trusted jobs with the next action already clear.
            </Text>
          </View>
          {user?.id ? (
            <View className="rounded-2xl border border-[#D8E8ED] bg-white p-3">
              <NotificationBell userId={user.id} />
            </View>
          ) : null}
        </View>

        <View className="mb-4 rounded-[32px] bg-[#24384D] px-5 py-5">
          <Text className="text-xs font-semibold uppercase tracking-[1px] text-[#B8C9D4]">
            Your lane
          </Text>
          <Text className="mt-2 text-2xl font-bold text-white">
            {nearbyLocation.label || "Refresh your area"}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-[#D8E8ED]">
            {nearbyLocation.loading
              ? "Refreshing location and ranking the closest jobs."
              : "Jobs nearest to you are highlighted first, so you can move quickly on the strongest opportunities."}
          </Text>
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-[22px] bg-white/10 px-4 py-4">
              <Text className="text-2xl font-bold text-white">{nearbyJobsCount}</Text>
              <Text className="mt-1 text-xs uppercase tracking-[1px] text-[#B8C9D4]">Nearby jobs</Text>
            </View>
            <View className="flex-1 rounded-[22px] bg-white/10 px-4 py-4">
              <Text className="text-2xl font-bold text-white">{trustedJobsCount}</Text>
              <Text className="mt-1 text-xs uppercase tracking-[1px] text-[#B8C9D4]">Trusted clients</Text>
            </View>
          </View>
        </View>

        <View className="mb-4 rounded-[28px] border border-[#D8E8ED] bg-white p-4">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-bold text-slate-900">Shape your feed</Text>
              <Text className="mt-1 text-xs uppercase tracking-[1px] text-slate-400">
                Quiet updates, no interruptions
              </Text>
            </View>
            <View
              className={`flex-row items-center rounded-full px-3 py-2 ${
                isFilterRefreshing ? "bg-[#EDF3F5]" : "bg-[#F8FAFC]"
              }`}
            >
              {isFilterRefreshing ? <ActivityIndicator size="small" color="#2D4A6A" /> : null}
              <Text
                className={`text-xs font-bold ${
                  isFilterRefreshing ? "ml-2 text-[#2D4A6A]" : "text-slate-500"
                }`}
              >
                {isFilterRefreshing ? "Updating" : "Live"}
              </Text>
            </View>
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search service type or skill"
            placeholderTextColor="#94A3B8"
            className="rounded-2xl bg-[#F8FAFC] px-4 py-3 text-slate-900"
          />

          <View className="mt-4 flex-row flex-wrap gap-2">
            {QUICK_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveQuickFilter(filter)}
                className={`rounded-full px-4 py-2.5 ${
                  activeQuickFilter === filter ? "bg-slate-900" : "bg-slate-100"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    activeQuickFilter === filter ? "text-white" : "text-slate-600"
                  }`}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mt-4">
            <Text className="text-xs font-bold uppercase tracking-[1px] text-slate-400">
              Service
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {SERVICE_FILTERS.map((service) => (
                <TouchableOpacity
                  key={service}
                  onPress={() => setSelectedService(service)}
                  className={`rounded-full px-3 py-2 ${
                    selectedService === service ? "bg-[#D8E8ED]" : "bg-[#F8FAFC]"
                  }`}
                >
                  <Text className="text-xs font-bold text-slate-700">{service}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-2 text-xs font-bold uppercase tracking-[1px] text-slate-400">
                Budget cap
              </Text>
              <TextInput
                value={budgetCap}
                onChangeText={setBudgetCap}
                placeholder="Any"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
                className="rounded-2xl bg-[#F8FAFC] px-4 py-3 text-slate-900"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-2 text-xs font-bold uppercase tracking-[1px] text-slate-400">
                Client rating
              </Text>
              <TextInput
                value={minimumClientRating}
                onChangeText={setMinimumClientRating}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
                className="rounded-2xl bg-[#F8FAFC] px-4 py-3 text-slate-900"
              />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-xs font-bold uppercase tracking-[1px] text-slate-400">
              Sort
            </Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setSortBy(option.key)}
                  className={`rounded-full px-3 py-2 ${
                    sortBy === option.key ? "bg-[#2D4A6A]" : "bg-[#F8FAFC]"
                  }`}
                >
                  <Text className={`text-xs font-bold ${sortBy === option.key ? "text-white" : "text-slate-700"}`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-[#F8FAFC] p-4">
            <Text className="text-sm font-bold text-slate-900">Location ranking</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-500">
              {nearbyLocation.loading
                ? "Detecting your current area..."
                : nearbyLocation.label || "Allow location to rank jobs closest to you first."}
            </Text>
            <TouchableOpacity
              onPress={() => void loadNearbyLocation()}
              className="mt-3 self-start rounded-full bg-slate-900 px-4 py-2.5"
            >
              <Text className="text-xs font-bold text-white">
                {nearbyLocation.loading ? "Updating..." : "Refresh area"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ApplicationRadar
          applications={applicationRadar}
          loading={applicationRadarLoading}
          onOpenChat={openApplicationConversation}
        />

        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-slate-950">Available Jobs</Text>
            <Text className="mt-1 text-sm text-slate-500">
              {isFilterRefreshing ? "Refining results in the background" : "Ranked around your current preferences"}
            </Text>
          </View>
          <View className="rounded-full bg-slate-900 px-3 py-2">
            <Text className="text-xs font-bold text-white">{displayedJobs.length}</Text>
          </View>
        </View>

        {displayedJobs.length === 0 ? (
          <View className="rounded-[28px] border border-[#D8E8ED] bg-white p-6">
            <Text className="text-lg font-bold text-slate-900">No jobs match your filters</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-500">
              Try lowering the client rating filter, increasing the budget cap, or switching back to All jobs.
            </Text>
          </View>
        ) : (
          displayedJobs.map((job) => {
            const isApplied = appliedJobs.has(job.id)
            const isApplying = applyingJobs.has(job.id)
            const serviceTags = [...new Set(job.selectedServices.length ? job.selectedServices : [job.category])].slice(
              0,
              3
            )
            const metaLine = joinMeta([
              job.clientName,
              job.location,
              job.distanceKm != null ? `${job.distanceKm.toFixed(1)} km away` : null,
            ])
            const trustLabel =
              job.clientRating > 0
                ? `${job.clientRating.toFixed(1)} stars · ${job.clientReviewCount} review${
                    job.clientReviewCount === 1 ? "" : "s"
                  }`
                : "New client"

            return (
              <View key={job.id} className="mb-4 rounded-[30px] border border-[#DCE6EA] bg-white px-5 py-5">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <View className="flex-row flex-wrap gap-2">
                      {job.inYourArea ? (
                        <View className="rounded-full bg-emerald-50 px-3 py-1.5">
                          <Text className="text-[11px] font-bold uppercase tracking-[1px] text-emerald-700">
                            Nearby
                          </Text>
                        </View>
                      ) : null}
                      {job.isMatch ? (
                        <View className="rounded-full bg-[#EEF3F8] px-3 py-1.5">
                          <Text className="text-[11px] font-bold uppercase tracking-[1px] text-[#2D4A6A]">
                            Matched
                          </Text>
                        </View>
                      ) : null}
                      <View className="rounded-full bg-slate-100 px-3 py-1.5">
                        <Text className="text-[11px] font-bold uppercase tracking-[1px] text-slate-500">
                          {timeAgo(job.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <Text className="mt-3 text-[20px] font-bold leading-7 text-slate-950">{job.title}</Text>
                    <Text className="mt-2 text-sm leading-6 text-slate-500">{metaLine}</Text>
                  </View>

                  <View className="min-w-[104px] rounded-[24px] bg-[#F4F8F8] px-4 py-4">
                    <Text className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">Budget</Text>
                    <Text className="mt-2 text-2xl font-bold text-slate-950">R{job.budget.toFixed(0)}</Text>
                  </View>
                </View>

                <Text className="mt-4 text-sm leading-6 text-slate-600">{job.description}</Text>

                <View className="mt-4 flex-row flex-wrap gap-2">
                  {serviceTags.map((tag) => (
                    <View key={tag} className="rounded-full bg-[#F7FAFB] px-3 py-2">
                      <Text className="text-xs font-bold text-slate-700">{tag}</Text>
                    </View>
                  ))}
                </View>

                <View className="mt-4 rounded-[24px] bg-[#F7FAFB] px-4 py-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold uppercase tracking-[1px] text-slate-400">
                        Client trust
                      </Text>
                      <Text className="mt-2 text-sm font-semibold text-slate-900">{trustLabel}</Text>
                    </View>
                    <View className="rounded-full bg-white px-3 py-2">
                      <Text className="text-xs font-bold text-slate-600">{job.category}</Text>
                    </View>
                  </View>
                </View>

                <View className="mt-4 flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-xs font-bold uppercase tracking-[1px] text-slate-400">
                      Next step
                    </Text>
                    <Text className="mt-1 text-sm text-slate-500">
                      {isApplied ? "Application sent. Open the board for follow-up." : "Review the brief, then send your quote."}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleApply(job)}
                    disabled={isApplied || isApplying}
                    className={`rounded-full px-5 py-3.5 ${isApplied ? "bg-[#D8E8ED]" : "bg-[#2D4A6A]"}`}
                  >
                    {isApplying ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className={`text-sm font-bold ${isApplied ? "text-[#2D4A6A]" : "text-white"}`}>
                        {isApplied ? "Applied" : "Apply now"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      {selectedJob ? (
        <ApplicationModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={submitApplication}
          jobTitle={selectedJob.title}
          jobBudget={selectedJob.budget}
        />
      ) : null}
    </SafeAreaView>
  )
}

export default Home
