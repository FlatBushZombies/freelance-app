import { useEffect, useRef } from "react"
import {
  Animated,
  Dimensions,
  Easing,
  Text,
  View,
  Platform,
} from "react-native"
import Svg, { Circle, Line } from "react-native-svg"
import { BoltIcon } from "react-native-heroicons/solid"

const { width: W, height: H } = Dimensions.get("window")

/* ── Premium colour palette ── */
const C = {
  abyss:    "#0A0F1E",
  deep:     "#111827",
  navy:     "#1A2744",
  steel:    "#2D4A6A",
  cyan:     "#00D4FF",
  cyanMid:  "#38BDF8",
  cyanSoft: "#7DD3FC",
  ice:      "#E0F2FE",
  white:    "#FFFFFF",
  accent:   "#F59E0B",
}

/* ── Decorative grid / circuit lines ── */
const CircuitLines = ({ opacity }: { opacity: Animated.Value }) => (
  <Animated.View
    className="absolute inset-0"
    style={{ opacity: Animated.multiply(opacity, 0.08) }}
  >
    <Svg width={W} height={H}>
      {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((ratio, i) => (
        <Line
          key={`h${i}`}
          x1={0}
          y1={H * ratio}
          x2={W}
          y2={H * ratio}
          stroke={C.cyan}
          strokeWidth={0.5}
          strokeDasharray="6,12"
        />
      ))}
      {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => (
        <Line
          key={`v${i}`}
          x1={W * ratio}
          y1={0}
          x2={W * ratio}
          y2={H}
          stroke={C.cyan}
          strokeWidth={0.5}
          strokeDasharray="4,16"
        />
      ))}
      {[
        { x: W * 0.2, y: H * 0.15 },
        { x: W * 0.6, y: H * 0.3 },
        { x: W * 0.8, y: H * 0.45 },
        { x: W * 0.4, y: H * 0.6 },
        { x: W * 0.2, y: H * 0.75 },
        { x: W * 0.6, y: H * 0.9 },
      ].map((pt, i) => (
        <Circle key={`n${i}`} cx={pt.x} cy={pt.y} r={2.5} fill={C.cyan} opacity={0.4} />
      ))}
    </Svg>
  </Animated.View>
)

/* ── Floating particle dots ── */
const Particles = ({ opacity }: { opacity: Animated.Value }) => {
  const particles = [
    { x: W * 0.12, y: H * 0.18, r: 2, o: 0.6 },
    { x: W * 0.85, y: H * 0.12, r: 3, o: 0.4 },
    { x: W * 0.72, y: H * 0.28, r: 1.5, o: 0.7 },
    { x: W * 0.28, y: H * 0.82, r: 2.5, o: 0.5 },
    { x: W * 0.9, y: H * 0.7, r: 2, o: 0.3 },
    { x: W * 0.15, y: H * 0.55, r: 1.5, o: 0.5 },
    { x: W * 0.65, y: H * 0.85, r: 3, o: 0.35 },
    { x: W * 0.45, y: H * 0.1, r: 2, o: 0.55 },
  ]

  return (
    <Animated.View className="absolute inset-0" style={{ opacity }}>
      <Svg width={W} height={H}>
        {particles.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={p.r} fill={C.cyan} opacity={p.o} />
        ))}
      </Svg>
    </Animated.View>
  )
}

interface SplashScreenProps {
  onFinish: () => void
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  /* ── Animation values ── */
  const logoOpacity      = useRef(new Animated.Value(0)).current
  const logoScale        = useRef(new Animated.Value(0.72)).current
  const headlineY        = useRef(new Animated.Value(32)).current
  const headlineOpacity  = useRef(new Animated.Value(0)).current
  const spinnerOpacity   = useRef(new Animated.Value(0)).current
  const spinnerRotation  = useRef(new Animated.Value(0)).current
  const screenOpacity    = useRef(new Animated.Value(1)).current
  const circle1Scale     = useRef(new Animated.Value(0)).current
  const circle2Scale     = useRef(new Animated.Value(0)).current
  const glowPulse        = useRef(new Animated.Value(0.4)).current
  const gridOpacity      = useRef(new Animated.Value(0)).current
  const particlesOpacity = useRef(new Animated.Value(0)).current
  const taglineOpacity   = useRef(new Animated.Value(0)).current
  const taglineY         = useRef(new Animated.Value(16)).current
  const scanlineY        = useRef(new Animated.Value(-2)).current

  useEffect(() => {
    Animated.timing(gridOpacity, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start()

    Animated.sequence([
      Animated.delay(300),
      Animated.timing(particlesOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()

    Animated.parallel([
      Animated.spring(circle1Scale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(circle2Scale, {
        toValue: 1,
        tension: 30,
        friction: 7,
        delay: 120,
        useNativeDriver: true,
      }),
    ]).start()

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    Animated.sequence([
      Animated.delay(480),
      Animated.parallel([
        Animated.timing(headlineY, {
          toValue: 0,
          duration: 460,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(headlineOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    Animated.sequence([
      Animated.delay(720),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    Animated.sequence([
      Animated.delay(820),
      Animated.timing(spinnerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    Animated.loop(
      Animated.timing(spinnerRotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.9,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.4,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start()

    Animated.loop(
      Animated.timing(scanlineY, {
        toValue: H,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    Animated.sequence([
      Animated.delay(2400),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 480,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish())
  }, [])

  const spin = spinnerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <Animated.View
      className="absolute inset-0 items-center justify-center"
      style={{
        backgroundColor: C.abyss,
        opacity: screenOpacity,
        zIndex: 999,
      }}
    >
      {/* ── Background circuit grid ── */}
      <CircuitLines opacity={gridOpacity} />

      {/* ── Floating particles ── */}
      <Particles opacity={particlesOpacity} />

      {/* ── Scanning line effect ── */}
      <Animated.View
        className="absolute left-0 right-0"
        style={{
          height: 1,
          backgroundColor: C.cyan,
          opacity: 0.06,
          transform: [{ translateY: scanlineY }],
        }}
      />

      {/* ── Decorative glow orb — top-right ── */}
      <Animated.View
        className="absolute"
        style={{
          top: -W * 0.3,
          right: -W * 0.2,
          width: W * 0.85,
          height: W * 0.85,
          borderRadius: W * 0.425,
          backgroundColor: `${C.cyan}12`,
          borderWidth: 1,
          borderColor: `${C.cyan}15`,
          transform: [{ scale: circle1Scale }],
          opacity: glowPulse,
        }}
      />

      {/* ── Decorative glow orb — bottom-left ── */}
      <Animated.View
        className="absolute"
        style={{
          bottom: -W * 0.25,
          left: -W * 0.15,
          width: W * 0.7,
          height: W * 0.7,
          borderRadius: W * 0.35,
          backgroundColor: `${C.cyanMid}0A`,
          borderWidth: 1,
          borderColor: `${C.cyanMid}12`,
          transform: [{ scale: circle2Scale }],
          opacity: glowPulse,
        }}
      />

      {/* ── Small accent glow top-left ── */}
      <Animated.View
        className="absolute rounded-full"
        style={{
          top: H * 0.12,
          left: W * 0.08,
          width: 6,
          height: 6,
          backgroundColor: C.cyan,
          opacity: glowPulse,
          shadowColor: C.cyan,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 8,
        }}
      />

      {/* ── Centre content ── */}
      <View className="items-start w-full px-10">

        {/* Logo badge + name row */}
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <View className="flex-row items-center gap-x-3.5 mb-7">

            {/* Premium icon badge */}
            <View
              className="w-14 h-14 rounded-2xl items-center justify-center"
              style={{
                backgroundColor: `${C.navy}CC`,
                borderWidth: 1.5,
                borderColor: `${C.cyan}40`,
                shadowColor: C.cyan,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              <BoltIcon size={28} color={C.cyan} />
            </View>

            {/* Brand wordmark */}
            <View>
              <Text
                className="text-white"
                style={{
                  fontSize: 30,
                  letterSpacing: -0.8,
                  ...Platform.select({
                    ios: { fontFamily: "Georgia-Bold" },
                    android: { fontFamily: "serif", fontWeight: "bold" },
                  }),
                }}
              >
                Quickhands
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: C.cyan,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  marginTop: -2,
                  ...Platform.select({
                    ios: { fontFamily: "Helvetica Neue" },
                    android: { fontFamily: "sans-serif-light" },
                  }),
                }}
              >
                PRO
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Decorative separator line ── */}
        <Animated.View
          className="mb-6"
          style={{
            width: 48,
            height: 2,
            backgroundColor: C.cyan,
            opacity: headlineOpacity,
            shadowColor: C.cyan,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
            elevation: 6,
          }}
        />

        {/* Large display headline */}
        <Animated.Text
          className="text-white uppercase"
          style={{
            fontSize: 72,
            lineHeight: 74,
            letterSpacing: -3,
            opacity: headlineOpacity,
            transform: [{ translateY: headlineY }],
            ...Platform.select({
              ios: { fontFamily: "Georgia-Bold" },
              android: { fontFamily: "serif", fontWeight: "bold" },
            }),
          }}
        >
          {"Fast\nWork.\nFair\nPay."}
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          className="mt-5 uppercase"
          style={{
            fontSize: 14,
            color: `${C.cyanSoft}AA`,
            letterSpacing: 2,
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
            ...Platform.select({
              ios: { fontFamily: "Helvetica Neue" },
              android: { fontFamily: "sans-serif-light" },
            }),
          }}
        >
          Your work, your worth
        </Animated.Text>
      </View>

      {/* ── Premium spinner at bottom ── */}
      <Animated.View
        className="absolute bottom-16 items-center"
        style={{ opacity: spinnerOpacity }}
      >
        <Animated.View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2.5,
            borderColor: `${C.steel}50`,
            borderTopColor: C.cyan,
            transform: [{ rotate: spin }],
            shadowColor: C.cyan,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 6,
          }}
        />
        {/* Spinner glow dot */}
        <View
          className="absolute rounded-full"
          style={{
            top: -1,
            width: 5,
            height: 5,
            backgroundColor: C.cyan,
            shadowColor: C.cyan,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 6,
            elevation: 4,
          }}
        />
      </Animated.View>

      {/* ── Bottom edge line ── */}
      <View
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 1,
          backgroundColor: `${C.cyan}18`,
        }}
      />
    </Animated.View>
  )
}

export default SplashScreen