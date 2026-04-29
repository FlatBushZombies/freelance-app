import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native"
import {
  SignalIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  CheckBadgeIcon,
  ClockIcon,
  XCircleIcon,
  LockOpenIcon,
  PhoneArrowUpRightIcon,
  StarIcon,
  TagIcon,
} from "react-native-heroicons/outline"
import { CheckBadgeIcon as CheckBadgeSolid } from "react-native-heroicons/solid"

export interface ApplicationRadarItem {
  id: number
  jobId: number
  status: "pending" | "accepted" | "rejected"
  createdAt: string
  quotation?: string | null
  conversationId?: string
  job?: {
    serviceType?: string
    clientName?: string
  }
  applicationSpotlight?: {
    score: number
    badges: string[]
    summary: string
  }
  contactExchange?: {
    readyForDirectContact: boolean
    needsClientPhoneNumber: boolean
    phoneNumber?: string | null
    maskedPhoneNumber?: string | null
    contactName?: string | null
    contactInstructions?: string | null
  }
}

interface ApplicationRadarProps {
  applications: ApplicationRadarItem[]
  loading: boolean
  onOpenChat: (application: ApplicationRadarItem) => void
}

// Dynamic status config — runtime values, cannot be static Tailwind classes
function statusConfig(status: ApplicationRadarItem["status"]) {
  switch (status) {
    case "accepted":
      return {
        bg:   "#E8F5EE",
        text: "#2E7D52",
        dot:  "#4CAF7D",
        Icon: CheckBadgeIcon,
        label: "Accepted",
      }
    case "rejected":
      return {
        bg:   "#FEE2E2",
        text: "#B91C1C",
        dot:  "#EF4444",
        Icon: XCircleIcon,
        label: "Rejected",
      }
    default:
      return {
        bg:   "#FEF3C7",
        text: "#B45309",
        dot:  "#F59E0B",
        Icon: ClockIcon,
        label: "Pending",
      }
  }
}

async function openDialer(phoneNumber?: string | null) {
  if (!phoneNumber) return
  const target = `tel:${phoneNumber}`
  const supported = await Linking.canOpenURL(target)
  if (supported) Linking.openURL(target)
}

export function ApplicationRadar({
  applications,
  loading,
  onOpenChat,
}: ApplicationRadarProps) {
  return (
    <View className="mb-7">

      {/* ── Section header ── */}
      <View className="flex-row items-center justify-between mb-3.5">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-0.5">
            <SignalIcon size={16} color="#2D4A6A" />
            <Text
              style={{
                fontFamily: "Quicksand-Bold",
                fontSize: 16,
                letterSpacing: -0.4,
                color: "#1A1C1F",
              }}
            >
              Application Radar
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "Quicksand-Medium",
              fontSize: 12,
              color: "#6B7479",
              marginLeft: 24,
            }}
          >
            Track decisions, signals, and contact unlocks
          </Text>
        </View>

        {/* Count pill */}
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: "#D8E8ED" }}
        >
          <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 12, color: "#2D4A6A" }}>
            {applications.length}
          </Text>
        </View>
      </View>

      {/* ── Loading state ── */}
      {loading ? (
        <View
          className="bg-white rounded-2xl p-5"
          style={{ borderWidth: 0.5, borderColor: "#EBEff2" }}
        >
          <View className="flex-row items-center gap-2">
            <SignalIcon size={15} color="#A8B2B5" />
            <Text style={{ fontFamily: "Quicksand-SemiBold", fontSize: 13, color: "#6B7479" }}>
              Refreshing your live pipeline...
            </Text>
          </View>
        </View>

      ) : applications.length === 0 ? (

        /* ── Empty state ── */
        <View
          className="bg-white rounded-2xl p-5"
          style={{ borderWidth: 0.5, borderColor: "#EBEff2" }}
        >
          <Text
            style={{ fontFamily: "Quicksand-Bold", fontSize: 14, color: "#1A1C1F", marginBottom: 6 }}
          >
            No active applications yet
          </Text>
          <Text
            style={{ fontFamily: "Quicksand-Medium", fontSize: 13, lineHeight: 20, color: "#6B7479" }}
          >
            When you apply, this radar will show your strongest bids, accepted jobs, and any direct contact handoffs.
          </Text>
        </View>

      ) : (

        /* ── Cards ── */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {applications.map((application) => {
            const sc = statusConfig(application.status)
            const StatusIcon = sc.Icon

            return (
              <View
                key={application.id}
                className="bg-white rounded-2xl p-4"
                style={{ width: 280, borderWidth: 0.5, borderColor: "#EBEff2" }}
              >

                {/* ── Card header ── */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 pr-2.5">
                    <Text
                      style={{ fontFamily: "Quicksand-Bold", fontSize: 14, color: "#1A1C1F", marginBottom: 3 }}
                      numberOfLines={2}
                    >
                      {application.job?.serviceType || "Job application"}
                    </Text>
                    <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 12, color: "#6B7479" }}>
                      {application.job?.clientName || "QuickHands client"}
                    </Text>
                  </View>

                  {/* Status badge with dot + icon */}
                  <View
                    className="flex-row items-center gap-1 px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: sc.bg }}
                  >
                    <View
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: sc.dot }}
                    />
                    <Text
                      style={{ fontFamily: "Quicksand-Bold", fontSize: 11, color: sc.text }}
                    >
                      {sc.label}
                    </Text>
                  </View>
                </View>

                {/* ── Signal / Spotlight block ── */}
                {application.applicationSpotlight ? (
                  <View
                    className="rounded-xl p-3 mb-3"
                    style={{ backgroundColor: "#F8FAFC", borderWidth: 0.5, borderColor: "#E2EAF0" }}
                  >
                    {/* Score row */}
                    <View className="flex-row items-center gap-1.5 mb-2">
                      <StarIcon size={13} color="#2D4A6A" />
                      <Text
                        style={{ fontFamily: "Quicksand-Bold", fontSize: 12, color: "#2D4A6A" }}
                      >
                        Signal score {application.applicationSpotlight.score}
                      </Text>
                    </View>

                    <Text
                      style={{ fontFamily: "Quicksand-Medium", fontSize: 12, lineHeight: 18, color: "#405164", marginBottom: 8 }}
                    >
                      {application.applicationSpotlight.summary}
                    </Text>

                    {/* Badges */}
                    <View className="flex-row flex-wrap gap-1.5">
                      {application.applicationSpotlight.badges.slice(0, 3).map((badge) => (
                        <View
                          key={badge}
                          className="flex-row items-center gap-1 px-2 py-1 rounded-full"
                          style={{ backgroundColor: "#E8F5EE", borderWidth: 0.5, borderColor: "#B6DFC9" }}
                        >
                          <CheckBadgeSolid size={10} color="#2E7D52" />
                          <Text
                            style={{ fontFamily: "Quicksand-Bold", fontSize: 10, color: "#2E7D52" }}
                          >
                            {badge}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* ── Contact exchange: unlocked ── */}
                {application.contactExchange?.readyForDirectContact ? (
                  <View
                    className="rounded-xl p-3 mb-3"
                    style={{ backgroundColor: "#ECFDF5", borderWidth: 0.5, borderColor: "#A7F3D0" }}
                  >
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <LockOpenIcon size={13} color="#166534" />
                      <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 12, color: "#166534" }}>
                        Direct contact unlocked
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <PhoneIcon size={12} color="#166534" />
                      <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 12, color: "#166534" }}>
                        {application.contactExchange.contactName || "Client"}:{" "}
                        {application.contactExchange.phoneNumber || application.contactExchange.maskedPhoneNumber}
                      </Text>
                    </View>
                  </View>

                ) : application.contactExchange?.needsClientPhoneNumber ? (

                  /* ── Contact exchange: waiting ── */
                  <View
                    className="rounded-xl p-3 mb-3"
                    style={{ backgroundColor: "#FFF7ED", borderWidth: 0.5, borderColor: "#FED7AA" }}
                  >
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <ClockIcon size={13} color="#C2410C" />
                      <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 12, color: "#C2410C" }}>
                        Accepted, waiting for phone number
                      </Text>
                    </View>
                    <Text style={{ fontFamily: "Quicksand-Medium", fontSize: 12, lineHeight: 18, color: "#C2410C" }}>
                      Stay ready. The client has accepted your application and still needs to share their direct contact.
                    </Text>
                  </View>

                ) : null}

                {/* ── Action buttons ── */}
                {(application.conversationId || application.contactExchange?.readyForDirectContact) ? (
                  <View className="flex-row gap-2 mt-1">
                    {application.conversationId ? (
                      <TouchableOpacity
                        onPress={() => onOpenChat(application)}
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl"
                        style={{ backgroundColor: "#2D4A6A" }}
                      >
                        <ChatBubbleLeftRightIcon size={14} color="#FFFFFF" />
                        <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 13, color: "#FFFFFF" }}>
                          Open board
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {application.contactExchange?.readyForDirectContact ? (
                      <TouchableOpacity
                        onPress={() => openDialer(application.contactExchange?.phoneNumber)}
                        className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl"
                        style={{ backgroundColor: "#2E7D52" }}
                      >
                        <PhoneArrowUpRightIcon size={14} color="#FFFFFF" />
                        <Text style={{ fontFamily: "Quicksand-Bold", fontSize: 13, color: "#FFFFFF" }}>
                          Call client
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}

              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}
