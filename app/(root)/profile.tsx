"use client"

import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useUser, useAuth } from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import { router } from "expo-router"
import WalletComponent from "@/components/WalletComponent"
import { getApiUrl } from "@/lib/fetch"

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
            color={value <= rating ? "#F59E0B" : "#CBD5E1"}
          />
        </TouchableOpacity>
      ))}
    </View>
  )
}

const ProfileScreen = () => {
  const { user } = useUser()
  const { getToken } = useAuth()
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

  const fetchProfileData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const token = await getToken()
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
      setProjects([])
      setReceivedReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchProfileData()
  }, [getToken, user?.id])

  const acceptedProjects = projects.filter((project) => project.status === "accepted")
  const pendingProjects = projects.filter((project) => project.status === "pending")
  const rejectedProjects = projects.filter((project) => project.status === "rejected")

  const getStatusConfig = (status: ProjectItem["status"]) => {
    switch (status) {
      case "accepted":
        return { bg: "#ECFDF5", text: "#166534", label: "Accepted", dot: "#22C55E" }
      case "pending":
        return { bg: "#FEF3C7", text: "#92400E", label: "Pending", dot: "#F59E0B" }
      default:
        return { bg: "#FEE2E2", text: "#B91C1C", label: "Rejected", dot: "#EF4444" }
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
      >
        <View className="mb-3 flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-950">{project.title}</Text>
            <Text className="mt-1 text-sm text-slate-500">{project.client} · {project.category}</Text>
          </View>
          <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: config.bg }}>
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
            style={{ borderLeftWidth: 3, borderLeftColor: "#2D4A6A", backgroundColor: "#F8FAFC" }}
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
              placeholderTextColor="#94A3B8"
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
        },
        {
          title: "About you",
          value: "Write important information that clients might need to know",
          icon: "pencil",
        },
        {
          title: "Education and experience",
          value: "Add the education you have and past work experience",
          icon: "add",
        },
        {
          title: "Address and region",
          value: "We use your area to show nearby jobs without exposing your full address.",
          icon: "add",
        },
      ].map((item) => (
        <View
          key={item.title}
          className="mb-2.5 rounded-xl border border-slate-200 bg-white p-4"
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="mb-1.5 text-[11px] font-medium uppercase text-slate-400">
                {item.title}
              </Text>
              <Text className="text-[13px] leading-5 text-slate-600">{item.value}</Text>
            </View>
            <TouchableOpacity className="p-1">
              <Ionicons name={item.icon as any} size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  )

  const renderProjects = () => {
    if (loading) {
      return (
        <View className="py-12 items-center">
          <ActivityIndicator size="large" color="#2D4A6A" />
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
            <Text className="mb-3 text-[13px] font-medium text-slate-900">
              Accepted · {acceptedProjects.length}
            </Text>
            {acceptedProjects.map(renderProject)}
          </View>
        ) : null}

        {pendingProjects.length > 0 ? (
          <View className="mb-5">
            <Text className="mb-3 text-[13px] font-medium text-slate-900">
              Pending · {pendingProjects.length}
            </Text>
            {pendingProjects.map(renderProject)}
          </View>
        ) : null}

        {rejectedProjects.length > 0 ? (
          <View className="mb-5">
            <Text className="mb-3 text-[13px] font-medium text-slate-900">
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
        <Text className="mt-2 text-4xl font-bold text-slate-950">
          {reviewSummary.averageRating > 0 ? reviewSummary.averageRating.toFixed(1) : "New"}
        </Text>
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
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-bold text-slate-950">{review.reviewerName}</Text>
              <View className="flex-row gap-1">
                {Array.from({ length: 5 }, (_, index) => (
                  <Ionicons
                    key={index}
                    name={index < review.rating ? "star" : "star-outline"}
                    size={14}
                    color={index < review.rating ? "#F59E0B" : "#CBD5E1"}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <View className="items-center">
              <Text className="mb-2.5 text-base font-medium text-slate-900">
                Verify your account
              </Text>
              <Text className="mb-6 text-center text-[13px] leading-5 text-slate-500">
                Clients choose specialists with a verified ID or Passport. It only takes a minute.
              </Text>
              <TouchableOpacity
                className="w-full rounded-[10px] bg-slate-900 px-6 py-3.5"
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
          <Ionicons name="settings-outline" size={19} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Whop-style profile header ── */}
        <View style={profileStyles.hero}>

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
                <ActivityIndicator size="small" color="#2D4A6A" />
              ) : (
                <>
                  <View style={profileStyles.statItem}>
                    <Text style={profileStyles.statValue}>{projects.length}</Text>
                    <Text style={profileStyles.statLabel}>applied</Text>
                  </View>
                  <View style={profileStyles.statDivider} />
                  <View style={profileStyles.statItem}>
                    <Text style={profileStyles.statValue}>
                      {reviewSummary.averageRating > 0
                        ? reviewSummary.averageRating.toFixed(1)
                        : "—"}
                    </Text>
                    <Text style={profileStyles.statLabel}>rating</Text>
                  </View>
                  <View style={profileStyles.statDivider} />
                  <View style={profileStyles.statItem}>
                    <Text style={profileStyles.statValue}>{acceptedProjects.length}</Text>
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
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
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
    borderColor: "#E5E7EB",
  },
  topNavUsername: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
    flex: 1,
  },
  topNavSettings: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F4F5F7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  /* Header hero */
  hero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },

  /* Avatar row */
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  /* Stats */
  statsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginLeft: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E5E7EB",
  },

  /* Name + handle */
  fullName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  handle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  joined: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 3,
  },

  /* Action buttons */
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },

  /* Tab bar */
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: "#1F3A4A",
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: "#9CA3AF",
  },
  tabLabelActive: {
    fontWeight: "600",
    color: "#1F3A4A",
  },
})

export default ProfileScreen
