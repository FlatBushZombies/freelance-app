import { useEffect, useRef } from "react"
import {
  Animated,
  Dimensions,
  Easing,
  Text,
  View,
  Platform,
} from "react-native"

const { width: W, height: H } = Dimensions.get("window")

const C = {
  forest:  "#2D4A6A",
  fern:    "#52839B",
  leaf:    "#74A0B9",
  sage:    "#B8C9D4",
  mint:    "#D8E8ED",
  cloud:   "#FFFFFF",
}

interface SplashScreenProps {
  onFinish: () => void
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const logoOpacity     = useRef(new Animated.Value(0)).current
  const logoScale       = useRef(new Animated.Value(0.72)).current
  const headlineY       = useRef(new Animated.Value(32)).current
  const headlineOpacity = useRef(new Animated.Value(0)).current
  const spinnerOpacity  = useRef(new Animated.Value(0)).current
  const spinnerRotation = useRef(new Animated.Value(0)).current
  const screenOpacity   = useRef(new Animated.Value(1)).current
  const circle1Scale    = useRef(new Animated.Value(0)).current
  const circle2Scale    = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(circle1Scale, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.spring(circle2Scale, { toValue: 1, tension: 30, friction: 7, delay: 120, useNativeDriver: true }),
    ]).start()

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
      ]),
    ]).start()

    Animated.sequence([
      Animated.delay(480),
      Animated.parallel([
        Animated.timing(headlineY,       { toValue: 0, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(headlineOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad),  useNativeDriver: true }),
      ]),
    ]).start()

    Animated.sequence([
      Animated.delay(820),
      Animated.timing(spinnerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()

    Animated.loop(
      Animated.timing(spinnerRotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    Animated.sequence([
      Animated.delay(2400),
      Animated.timing(screenOpacity, { toValue: 0, duration: 480, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]).start(() => onFinish())
  }, [])

  const spin = spinnerRotation.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <Animated.View
      className="absolute inset-0 items-center justify-center z-[999]"
      style={{ backgroundColor: C.forest, opacity: screenOpacity }}
    >
      {/* ── Decorative background circles ── */}
      <Animated.View
        className="absolute rounded-full"
        style={{
          top:    -W * 0.35,
          right:  -W * 0.25,
          width:   W * 0.9,
          height:  W * 0.9,
          borderRadius: W * 0.45,
          backgroundColor: `${C.fern}28`,
          transform: [{ scale: circle1Scale }],
        }}
      />
      <Animated.View
        className="absolute rounded-full"
        style={{
          bottom: -W * 0.3,
          left:   -W * 0.2,
          width:   W * 0.75,
          height:  W * 0.75,
          borderRadius: W * 0.375,
          backgroundColor: `${C.leaf}18`,
          transform: [{ scale: circle2Scale }],
        }}
      />

      {/* ── Centre content ── */}
      <View className="items-start px-10 w-full">

        {/* Badge + name row */}
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <View className="flex-row items-center gap-3.5 mb-7">
            <View
              className="w-[52px] h-[52px] rounded-2xl items-center justify-center border-[1.5px]"
              style={{
                backgroundColor: `${C.fern}40`,
                borderColor:     `${C.leaf}50`,
              }}
            >
              <Text className="text-2xl">⚡</Text>
            </View>
            <Text
              className="font-quicksand-bold text-white tracking-[-1.2px]"
              style={{
                fontSize: 34,
                // Keep platform serif for the display wordmark as per original design
                ...Platform.select({
                  ios:     { fontFamily: "Georgia" },
                  android: { fontFamily: "serif" },
                }),
              }}
            >
              Quickhands Pro
            </Text>
          </View>
        </Animated.View>

        {/* Large display headline */}
        <Animated.Text
          className="font-quicksand-bold text-white uppercase"
          style={{
            fontSize:      72,
            lineHeight:    72,
            letterSpacing: -3,
            opacity:       headlineOpacity,
            // Keep platform serif for the large display type as per original design
            ...Platform.select({
              ios:     { fontFamily: "Georgia-Bold" },
              android: { fontFamily: "serif" },
            }),
            transform: [{ translateY: headlineY }],
          }}
        >
          {"Fast\nWork.\nFair\nPay."}
        </Animated.Text>
      </View>

      {/* ── Spinner at bottom ── */}
      <Animated.View
        className="absolute bottom-16 items-center"
        style={{ opacity: spinnerOpacity }}
      >
        <Animated.View
          className="w-7 h-7 rounded-full border-[3px]"
          style={{
            borderColor:    `${C.sage}40`,
            borderTopColor: C.sage,
            transform:      [{ rotate: spin }],
          }}
        />
      </Animated.View>
    </Animated.View>
  )
}

export default SplashScreen