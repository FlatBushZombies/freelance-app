import { Stack, SplashScreen } from "expo-router";
import { useFonts } from 'expo-font';
import { useEffect } from "react";
import  Toast  from "react-native-toast-message"

import { ClerkProvider } from '@clerk/clerk-expo'

import './globals.css';


const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "Quicksand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
    "QuickSand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
    "QuickSand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
    "QuickSand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
    "QuickSand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();


  }, [fontsLoaded, error])
  return ( 
    
  <ClerkProvider publishableKey={publishableKey}>
  <Stack  screenOptions={{headerShown: false}}/> 
  <Toast />
  </ClerkProvider>
);
}
