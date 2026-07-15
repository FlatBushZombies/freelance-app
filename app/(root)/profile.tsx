"use client"

import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useUser, useAuth } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { COLORS, RADIUS, SHADOW } from "@/constants/theme"
import { useEffect, useRef, useState } from "react"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import WalletComponent from "@/components/WalletComponent"
import { getApiUrl } from "@/lib/fetch"
import { showErrorToast, showInfoToast } from "@/lib/toast"
import {
  hasAcceptedApplication,
  startBackgroundProximityTracking,
  stopBackgroundProximityTracking,
} from "@/lib/backgroundLocation"

const PROXIMITY_TRACKING_STORAGE_KEY = "quickhands_proximity_tracking_enabled"

const FALLBACK_PROFILE_IMAGE = require("../../assets/images/quickhands.png")

interface ReviewSummary {
  averageRating: number
  reviewCount: number
  latestReview?: {
    rating: number
    comment: string
    reviewerName: string
    createdAt: string
  } | null
}

interface ProjectItem {
  id: number
  jobId: number
  conversationId?: string
  title: string
  client: string
  clientClerkId?: string
  status: "accepted" | "pending" | "rejected"
  startDate: string
  quotation: string
  conditions: string
  category: string
  budget: string
  clientReviewSummary: ReviewSummary
}

interface ReviewItem {
  id: string
  rating: number
  comment: string
  reviewerName: string
  createdAt: string
}

interface ReviewDraft {
  rating: number
  comment: string
}

function StarPicker({
  rating,
  onChange,
}: {
  rating: number
  onChange: (value: number) => void
}) {
  return (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((value) => (
        <TouchableOpacity key={value} onPress={() => onChange(value)}>
          <Ionicons
            name={value <= rating ? "star" : "star-outline"}
            size={20}
            color={value <= rating ? COLORS.warning : "#CBD5E1"}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}

const ProfileScreen = () => {
  const { user } = useUser()
  const { getToken } = useAuth()
  const getTokenRef = useRef(getToken)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [activeTab, setActiveTab] = useState("projects")
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({
    averageRating: 0,
    reviewCount: 0,
    latestReview: null,
  })
  const [receivedReviews, setReceivedReviews] = useState<ReviewItem[]>([])
  const [reviewDrafts, setReviewDrafts] = useState<Record<number, ReviewDraft>>({})
  const [submittingReviewId, setSubmittingReviewId] = useState<number | null>(null)
  const [proximityTrackingEnabled, setProximityTrackingEnabled] = useState(false)
  const [proximityTrackingBusy, setProximityTrackingBusy] = useState(false)

  useEffect(() => {
    getTokenRef.current = getToken
  }, [getToken])

  useEffect(() => {
    AsyncStorage.getItem(PROXIMITY_TRACKING_STORAGE_KEY).then((value) => {
      setProximityTrackingEnabled(value === "true")
    })
  }, [])

  const toggleProximityTracking = async (nextValue: boolean) => {
    if (proximityTrackingBusy) return
    setProximityTrackingBusy(true)

    try {
      if (!nextValue) {
        await stopBackgroundProximityTracking()
        await AsyncStorage.setItem(PROXIMITY_TRACKING_STORAGE_KEY, "false")
        setProximityTrackingEnabled(false)
        return
      }

      const eligible = await hasAcceptedApplication(getToken)
      if (!eligible) {
        showInfoToast(
          "No accepted jobs yet",
          "This turns on automatically once a client accepts one of your applications. You can still enable it now — it'll start sharing location the moment that happens."
        )
      }

      const result = await startBackgroundProximityTracking(getToken)
      if (!result.started) {
        showErrorToast(
          "Couldn't turn this on",
          result.reason || "Please allow location access and try again."
        )
        return
      }

      await AsyncStorage.setItem(PROXIMITY_TRACKING_STORAGE_KEY, "true")
      setProximityTrackingEnabled(true)
    } finally {
      setProximityTrackingBusy(false)
    }
  }

  const fetchProfileData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const token = await getTokenRef.current()
      if (!token) {
        return
      }

      const [applicationsResponse, reviewsResponse] = await Promise.all([
        fetch(getApiUrl("/api/applications/my"), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl(`/api/user/${user.id}/reviews`)),
      ])

      const applicationsData = await applicationsResponse.json()
      const reviewsData = await reviewsResponse.json()

      if (applicationsData.success && Array.isArray(applicationsData.data)) {
        const mappedProjects = applicationsData.data.map((application: any) => ({
          id: application.id,
          jobId: application.jobId,
          conversationId: application.conversationId,
          title: application.jobServiceType || "Untitled Job",
          client: application.jobOwnerName || "Client",
          clientClerkId: application.jobClerkId || undefined,
          status: application.status,
          startDate: application.createdAt,
          quotation: application.quotation || "Not specified",
          conditions: application.conditions || "",
          category: application.jobServiceType || "General",
          budget: application.quotation || "N/A",
          clientReviewSummary: application.clientReviewSummary || {
            averageRating: 0,
            reviewCount: 0,
            latestReview: null,
          },
        }))
        setProjects(mappedProjects)
      } else {
        setProjects([])
      }

      if (reviewsData.success) {
        setReviewSummary(reviewsData.summary || { averageRating: 0, reviewCount: 0, latestReview: null })
        setReceivedReviews(Array.isArray(reviewsData.reviews) ? reviewsData.reviews : [])
      } else {
        setReviewSummary({ averageRating: 0, reviewCount: 0, latestReview: null })
        setReceivedReviews([])
      }
    } catch (error) {
      console.error("Error fetching freelancer profile data:", error)
      showErrorToast("Couldn't load your profile", "Pull down to try again.")
      setProjects([])
      setReceivedReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchProfileData()
  }, [user?.id])

  const acceptedProjects = projects.filter((project) => project.status === "accepted")
  const pendingProjects = projects.filter((project) => project.status === "pending")
  const rejectedProjects = projects.filter((project) => project.status === "rejected")

  const getStatusConfig = (status: ProjectItem["status"]) => {
    switch (status) {
      case "accepted":
        return { bg: "#ECFDF5", text: "#166534", label: "Accepted", dot: COLORS.success }
      case "pending":
        return { bg: "#FEF3C7", text: "#92400E", label: "Pending", dot: COLORS.warning }
      default:
        return { bg: "#FEE2E2", text: "#B91C1C", label: "Rejected", dot: COLORS.error }
    }
  }

  const openBoard = (project: ProjectItem) => {
    if (!project.conversationId) {
      return
    }

    router.push({
      pathname: "/(root)/chat",
      params: {
        conversationId: project.conversationId,
        otherDisplayName: project.client,
        jobTitle: project.title,
      },
    })
  }

  const submitClientReview = async (project: ProjectItem) => {
    const draft = reviewDrafts[project.id]
    if (!draft?.rating) {
      return
    }

    try {
      setSubmittingReviewId(project.id)
      const token = await getToken()
      const response = await fetch(getApiUrl(`/api/applications/${project.id}/reviews`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save review")
      }

      await fetchProfileData()
    } catch (error) {
      console.error("Failed to save client review", error)
      showErrorToast(
        "Couldn't save review",
        error instanceof Error ? error.message : "Please try again."
      )
    } finally {
      setSubmittingReviewId(null)
    }
  }

  const renderProject = (project: ProjectItem) => {
    const config = getStatusConfig(project.status)
    const draft = reviewDrafts[project.id] || { rating: 5, comment: "" }

    return (
      <View
        key={project.id}
        className="mb-3 rounded-[24px] border border-slate-200 bg-white p-4"
        style={profileStyles.cardShadow}
      >
        <View className="mb-3 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-950">{project.title}</Text>
            <Text className="mt-1 text-sm text-slate-500">{project.client} · {project.category}</Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ backgroundColor: config.bg }}
          >
            <View
              style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: config.dot }}
            />
            <Text className="text-xs font-bold" style={{ color: config.text }}>
              {config.label}
            </Text>
          </View>
        </View>

        <View className="mb-3 rounded-2xl bg-slate-50 p-4">
          <Text className="text-xs font-bold uppercase tracking-[1px] text-slate-400">
            Client rating
          </Text>
          <Text className="mt-2 text-2xl font-bold text-slate-950">
            {project.clientReviewSummary.averageRating > 0
              ? project.clientReviewSummary.averageRating.toFixed(1)
              : "New"}
          </Text>
          <Text className="mt-1 text-xs text-slate-500">
            {project.clientReviewSummary.reviewCount} review
            {project.clientReviewSummary.reviewCount === 1 ? "" : "s"}
          </Text>
        </View>

        <View className="mb-3 flex-row gap-3">
          <View
            className="flex-1 rounded-2xl p-3"
            style={{ borderLeftWidth: 3, borderLeftColor: COLORS.navy, backgroundColor: COLORS.surfaceMuted }}
          >
            <Text className="text-xs font-bold uppercase tracking-[1px] text-slate-400">
              Quotation
            </Text>
            <Text className="mt-2 text-sm font-semibold text-slate-900">{project.quotation}</Text>
          </View>
        </View>

        {project.conditions ? (
          <Text className="mb-3 text-sm leading-6 text-slate-500">Terms: {project.conditions}</Text>
        ) : null}

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xs text-slate-400">
            Applied {new Date(project.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
          <Text className="text-sm font-semibold text-slate-900">{project.budget}</Text>
        </View>

        {project.status === "accepted" ? (
          <View className="mb-3 rounded-2xl bg-slate-50 p-4">
            <Text className="text-sm font-bold text-slate-900">Rate this client</Text>
            <Text className="mt-1 text-sm leading-6 text-slate-500">
              Share how reliable the client was so other freelancers know what to expect.
            </Text>
            <View className="mt-3">
              <StarPicker
                rating={draft.rating}
                onChange={(value) =>
                  setReviewDrafts((current) => ({
                    ...current,
                    [project.id]: {
                      ...draft,
                      rating: value,
                    },
                  }))
                }
              />
            </View>
            <TextInput
              value={draft.comment}
              onChangeText={(value) =>
                setReviewDrafts((current) => ({
                  ...current,
                  [project.id]: {
                    ...draft,
                    comment: value,
                  },
                }))
              }
              placeholder="Optional comment"
              placeholderTextColor={COLORS.textMuted}
              multiline
              className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900"
              style={{ minHeight: 86, textAlignVertical: "top" }}
            />
            <View className="mt-3 flex-row gap-2">
              {project.conversationId ? (
                <TouchableOpacity onPress={() => openBoard(project)} className="rounded-full bg-[#2D4A6A] px-4 py-2.5">
                  <Text className="text-xs font-bold text-white">Open board</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => submitClientReview(project)}
                className="rounded-full bg-slate-900 px-4 py-2.5"
                disabled={submittingReviewId === project.id}
              >
                <Text className="text-xs font-bold text-white">
                  {submittingReviewId === project.id ? "Saving..." : "Save review"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : project.conversationId ? (
          <TouchableOpacity onPress={() => openBoard(project)} className="rounded-full bg-[#2D4A6A] px-4 py-2.5 self-start">
            <Text className="text-xs font-bold text-white">Open board</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    )
  }

  const renderPersonalInfo = () => (
    <View className="px-4 pt-5">
      {[
        {
          title: "Full name",
          value: user?.fullName || "Please fill in your name",
          icon: "pencil",
          leftIcon: "person-outline",
        },
        {
          title: "About you",
          value: "Write important information that clients might need to know",
          icon: "pencil",
          leftIcon: "information-circle-outline",
        },
        {
          title: "Education and experience",
          value: "Add the education you have and past work experience",
          icon: "add",
          leftIcon: "school-outline",
        },
        {
          title: "Address and region",
          value: "We use your area to show nearby jobs without exposing your full address.",
          icon: "add",
          leftIcon: "location-outline",
        },
      ].map((item) => (
        <View
          key={item.title}
          className="mb-2.5 rounded-xl border border-slate-200 bg-white p-4"
          style={profileStyles.cardShadow}
        >
          <View className="flex-row items-start justify-between">
            <View style={profileStyles.infoIconCircle}>
              <Ionicons name={item.leftIcon as any} size={16} color={COLORS.navy} />
            </View>
            <View className="flex-1">
              <Text className="mb-1.5 text-[11px] font-medium uppercase text-slate-400">
                {item.title}
              </Text>
              <Text className="text-[13px] leading-5 text-slate-600">{item.value}</Text>
            </View>
            <TouchableOpacity className="p-1">
              <Ionicons name={item.icon as any} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View
        className="mb-2.5 rounded-xl border border-slate-200 bg-white p-4"
        style={profileStyles.cardShadow}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="mb-1.5 text-[11px] font-medium uppercase text-slate-400">
              Nearby arrival alerts
            </Text>
            <Text className="text-[13px] leading-5 text-slate-600">
              Let clients know when you're arriving. Shares your location in the background,
              starting once a client accepts one of your applications.
            </Text>
          </View>
          {proximityTrackingBusy ? (
            <ActivityIndicator size="small" color={COLORS.navy} />
          ) : (
            <Switch
              value={proximityTrackingEnabled}
              onValueChange={toggleProximityTracking}
              trackColor={{ false: COLORS.border, true: COLORS.navySoft }}
              thumbColor={proximityTrackingEnabled ? COLORS.navy : COLORS.surface}
            />
          )}
        </View>
      </View>
    </View>
  )

  const renderProjects = () => {
    if (loading) {
      return (
        <View className="py-12 items-center">
          <ActivityIndicator size="large" color={COLORS.navy} />
          <Text className="mt-3.5 text-[13px] text-slate-400">
            Loading your applications...
          </Text>
        </View>
      )
    }

    return (
      <View className="px-4 pt-5">
        {acceptedProjects.length > 0 ? (
          <View className="mb-5">
            <Text
              className="mb-3 text-[13px] font-medium text-slate-900"
              style={profileStyles.sectionLabel}
            >
              Accepted · {acceptedProjects.length}
            </Text>
            {acceptedProjects.map(renderProject)}
          </View>
        ) : null}

        {pendingProjects.length > 0 ? (
          <View className="mb-5">
            <Text
              className="mb-3 text-[13px] font-medium text-slate-900"
              style={profileStyles.sectionLabel}
            >
              Pending · {pendingProjects.length}
            </Text>
            {pendingProjects.map(renderProject)}
          </View>
        ) : null}

        {rejectedProjects.length > 0 ? (
          <View className="mb-5">
            <Text
              className="mb-3 text-[13px] font-medium text-slate-900"
              style={profileStyles.sectionLabel}
            >
              Rejected · {rejectedProjects.length}
            </Text>
            {rejectedProjects.map(renderProject)}
          </View>
        ) : null}

        {projects.length === 0 ? (
          <View className="rounded-xl border border-slate-200 bg-white p-10 items-center">
            <Ionicons name="briefcase-outline" size={36} color="#D1D5DB" />
            <Text className="mt-4 text-sm font-medium text-slate-700">No applications yet</Text>
            <Text className="mt-1.5 text-center text-[13px] leading-5 text-slate-400">
              Start browsing available tasks to begin your freelancing journey.
            </Text>
          </View>
        ) : null}
      </View>
    )
  }

  const renderReviews = () => (
    <View className="px-4 pt-5">
      <View className="mb-4 rounded-[24px] border border-slate-200 bg-white p-5">
        <Text className="text-xs font-bold uppercase tracking-[1px] text-slate-400">Your rating</Text>
        <View className="mt-2 flex-row items-center gap-2">
          <Ionicons name="star" size={22} color={COLORS.warning} />
          <Text className="text-4xl font-bold text-slate-950">
            {reviewSummary.averageRating > 0 ? reviewSummary.averageRating.toFixed(1) : "New"}
          </Text>
        </View>
        <Text className="mt-2 text-sm text-slate-500">
          {reviewSummary.reviewCount} review{reviewSummary.reviewCount === 1 ? "" : "s"}
        </Text>
      </View>

      {receivedReviews.length === 0 ? (
        <View className="rounded-[24px] border border-slate-200 bg-white p-5">
          <Text className="text-sm text-slate-500">
            You do not have any reviews yet. Completed accepted jobs will start building your rating here.
          </Text>
        </View>
      ) : (
        receivedReviews.map((review) => (
          <View
            key={review.id}
            className="mb-3 rounded-[24px] border border-slate-200 bg-white p-4"
            style={profileStyles.cardShadow}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-slate-950">{review.reviewerName}</Text>
              <View className="flex-row gap-1">
                {Array.from({ length: 5 }, (_, index) => (
                  <Ionicons
                    key={index}
                    name={index < review.rating ? "star" : "star-outline"}
                    size={14}
                    color={index < review.rating ? COLORS.warning : "#CBD5E1"}
                  />
                ))}
              </View>
            </View>
            {review.comment ? (
              <Text className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</Text>
            ) : null}
            <Text className="mt-3 text-xs text-slate-400">
              {new Date(review.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </View>
  )

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null
  const handle = user?.username
    ? `@${user.username}`
    : user?.primaryEmailAddress?.emailAddress ?? null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* ── Verification modal (unchanged) ── */}
      <Modal
        visible={showVerificationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white p-6">
            <TouchableOpacity
              className="absolute right-4 top-4 z-10 p-1"
              onPress={() => setShowVerificationModal(false)}
            >
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
            <View className="items-center">
              <Text className="mb-2.5 text-base font-medium text-slate-900">
                Verify your account
              </Text>
              <Text className="mb-6 text-center text-[13px] leading-5 text-slate-500">
                Clients choose specialists with a verified ID or Passport. It only takes a minute.
              </Text>
              <TouchableOpacity
                className="w-full rounded-xl bg-slate-900 px-6 py-3.5"
                activeOpacity={0.85}
                onPress={() => setShowVerificationModal(false)}
              >
                <Text className="text-center text-sm font-medium text-white">
                  Verify your account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Whop-style top nav bar ── */}
      <View style={profileStyles.topNav}>
        <View style={profileStyles.topNavLeft}>
          <Image
            source={user?.imageUrl ? { uri: user.imageUrl } : FALLBACK_PROFILE_IMAGE}
            style={profileStyles.topNavAvatar}
          />
          <Text style={profileStyles.topNavUsername} numberOfLines={1}>
            {user?.username
              ? `@${user.username}`
              : user?.firstName || "Profile"}
          </Text>
        </View>
        <TouchableOpacity
          style={profileStyles.topNavSettings}
          onPress={() => setShowVerificationModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={19} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Whop-style profile header ── */}
        <View style={profileStyles.hero}>
          <LinearGradient
            colors={[COLORS.navy, COLORS.navyDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={profileStyles.heroBand}
          />

          {/* Avatar + stats row */}
          <View style={profileStyles.avatarRow}>
            {/* Avatar */}
            <View style={profileStyles.avatarWrap}>
              <Image
                source={user?.imageUrl ? { uri: user.imageUrl } : FALLBACK_PROFILE_IMAGE}
                style={profileStyles.avatar}
              />
              <View style={profileStyles.onlineDot} />
            </View>

            {/* Stats */}
            <View style={profileStyles.statsRow}>
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.navy} />
              ) : (
                <>
                  <View style={profileStyles.statItem}>
                    <View style={profileStyles.statValueRow}>
                      <Ionicons name="briefcase-outline" size={14} color={COLORS.textMuted} />
                      <Text style={profileStyles.statValue}>{projects.length}</Text>
                    </View>
                    <Text style={profileStyles.statLabel}>applied</Text>
                  </View>
                  <View style={profileStyles.statDivider} />
                  <View style={profileStyles.statItem}>
                    <View style={profileStyles.statValueRow}>
                      <Ionicons name="star" size={14} color={COLORS.warning} />
                      <Text style={profileStyles.statValue}>
                        {reviewSummary.averageRating > 0
                          ? reviewSummary.averageRating.toFixed(1)
                          : "—"}
                      </Text>
                    </View>
                    <Text style={profileStyles.statLabel}>rating</Text>
                  </View>
                  <View style={profileStyles.statDivider} />
                  <View style={profileStyles.statItem}>
                    <View style={profileStyles.statValueRow}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.textMuted} />
                      <Text style={profileStyles.statValue}>{acceptedProjects.length}</Text>
                    </View>
                    <Text style={profileStyles.statLabel}>accepted</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Name + handle */}
          <Text style={profileStyles.fullName}>{user?.fullName || "User"}</Text>
          {handle ? (
            <Text style={profileStyles.handle}>{handle}</Text>
          ) : null}
          {joinedDate ? (
            <Text style={profileStyles.joined}>Joined {joinedDate}</Text>
          ) : null}

          {/* Action buttons */}
          <View style={profileStyles.actionRow}>
            <TouchableOpacity
              style={profileStyles.actionBtn}
              onPress={() => setShowVerificationModal(true)}
              activeOpacity={0.75}
            >
              <Text style={profileStyles.actionBtnText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={profileStyles.actionBtn}
              activeOpacity={0.75}
            >
              <Text style={profileStyles.actionBtnText}>Share profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Section tabs ── */}
        <View style={profileStyles.tabBar}>
          {[
            { key: "projects", label: "Projects" },
            { key: "reviews", label: "Reviews" },
            { key: "personal", label: "Personal" },
            { key: "wallet", label: "Wallet" },
          ].map((tab) => {
            const active = activeTab === tab.key
            return (
              <TouchableOpacity
                key={tab.key}
                style={[profileStyles.tabItem, active && profileStyles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[profileStyles.tabLabel, active && profileStyles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* ── Tab content (logic unchanged) ── */}
        {activeTab === "projects"
          ? renderProjects()
          : activeTab === "reviews"
          ? renderReviews()
          : activeTab === "personal"
          ? renderPersonalInfo()
          : <WalletComponent />}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const profileStyles = StyleSheet.create({
  /* Top nav bar */
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  topNavLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  topNavAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topNavUsername: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
    flex: 1,
  },
  topNavSettings: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  /* Header hero */
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
  },
  heroBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 96,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },

  /* Avatar row */
  avatarRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 52,
    marginBottom: 14,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.card,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  onlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  /* Stats */
  statsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginLeft: 20,
    paddingBottom: 2,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
    fontFamily: "Quicksand-Bold",
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },

  fullName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    fontFamily: "Quicksand-Bold",
  },
  handle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  joined: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.card,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceMuted,
  },
  tabItemActive: {
    backgroundColor: COLORS.navy,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    fontFamily: "Quicksand-SemiBold",
  },
  tabLabelActive: {
    color: COLORS.surface,
  },

  /* Shared polish helpers */
  sectionLabel: {
    fontFamily: "Quicksand-SemiBold",
  },
  infoIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.navySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardShadow: {
    ...SHADOW.card,
  },
})

export default ProfileScreen
