// auth.ts
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { fetchAPI } from "@/lib/fetch";

export const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) console.log(`${key} was used 🔐 \n`);
      else console.log("No values stored under key: " + key);
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch {
      return;
    }
  },
};

export const googleOAuth = async (startOAuthFlow: any) => {
  try {
    const { createdSessionId, setActive, signUp, user } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/(root)/home"),
    });

    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });

      let isNewUser = false;

      // Check if the user already exists in your backend
      const response = await fetchAPI(`/api/user/${user?.id}`, {
        method: "GET",
      });

      if (response.status === 404) {
        // Create new user record
        await fetchAPI("/api/user", {
          method: "POST",
          body: JSON.stringify({
            name: `${user?.firstName || ""} ${user?.lastName || ""}`,
            email: user?.primaryEmailAddress?.emailAddress,
            clerkId: user?.id,
          }),
        });

        isNewUser = true;
      }

      return {
        success: true,
        isNewUser,
        message: "You have successfully signed in with Google",
      };
    }

    return {
      success: false,
      message: "An error occurred while signing in with Google",
    };
  } catch (err: any) {
    console.error("Google OAuth Error:", err);
    return {
      success: false,
      code: err.code,
      message: err?.errors?.[0]?.longMessage || "Unknown OAuth error",
    };
  }
};
