import { useEffect, useRef } from "react"
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native"
import { IMAGES } from "@/constants"

const C = {
  bg: "#FFFFFF",
  brand: "#1F3A4A",
  sub: "#94A3B0",
}

/* ─── Bouncing dot loader ─── */
const DotSpinner = () => {
  const d0 = useRef(new Animated.Value(0)).current
  const d1 = useRef(new Animated.Value(0)).current
  const d2 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const make = (d: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(d, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(Math.max(0, 420 - delay)),
        ])
      )

    const a0 = make(d0, 0)
    const a1 = make(d1, 140)
    const a2 = make(d2, 280)
    a0.start()
    a1.start()
    a2.start()
    return () => {
      a0.stop()
      a1.stop()
      a2.stop()
    }
  }, [])

  const dotStyle = (d: Animated.Value) => ({
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.brand,
    opacity: d.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] }),
    transform: [{
      translateY: d.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }),
    }],
  })

  return (
    <View style={styles.dotRow}>
      <Animated.View style={dotStyle(d0)} />
      <Animated.View style={dotStyle(d1)} />
      <Animated.View style={dotStyle(d2)} />
    </View>
  )
}

interface SplashScreenProps {
  onFinish: () => void
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const logoScale   = useRef(new Animated.Value(0.82)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const textY       = useRef(new Animated.Value(14)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const dotOpacity  = useRef(new Animated.Value(0)).current
  const screenOp    = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.sequence([
      // Logo fades + scales in
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]),
      // Brand text slides up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(textY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Dot loader fades in
      Animated.timing(dotOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Hold
      Animated.delay(680),
      // Fade to landing
      Animated.timing(screenOp, {
        toValue: 0,
        duration: 380,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish())
  }, [])

  return (
    <Animated.View style={[styles.container, { opacity: screenOp }]}>
      {/* Logo */}
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
          marginBottom: 22,
        }}
      >
        <View style={styles.logoShadow}>
          <Image
            source={IMAGES.logo}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* Brand name */}
      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textY }],
          alignItems: "center",
        }}
      >
        <Text style={styles.brandName}>Quickhands</Text>
        <Text style={styles.brandSub}>Pro</Text>
      </Animated.View>

      {/* Dot loader at bottom */}
      <Animated.View style={[styles.dotWrap, { opacity: dotOpacity }]}>
        <DotSpinner />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  logoShadow: {
    borderRadius: 26,
    shadowColor: "#1F3A4A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.13,
    shadowRadius: 22,
    elevation: 10,
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 26,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F3A4A",
    letterSpacing: 0.8,
    fontFamily: "Quicksand-Bold",
  },
  brandSub: {
    fontSize: 10,
    color: "#94A3B0",
    letterSpacing: 4,
    textTransform: "uppercase",
    marginTop: 3,
    fontFamily: "Quicksand-Medium",
  },
  dotWrap: {
    position: "absolute",
    bottom: 54,
  },
  dotRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
})

export default SplashScreen
