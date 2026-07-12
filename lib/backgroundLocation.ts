import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as SecureStore from "expo-secure-store";
import { getApiUrl } from "@/lib/fetch";
import { waitForClerkToken } from "@/lib/session";

export const PROXIMITY_LOCATION_TASK = "quickhands-proximity-location-task";
const DEVICE_LOCATION_TOKEN_KEY = "quickhands_device_location_token";

async function getCachedDeviceLocationToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(DEVICE_LOCATION_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Fetches (and caches in SecureStore) the opaque device-location token used
 * to authenticate background pings — background tasks have no React tree,
 * so they can't refresh a short-lived Clerk session JWT the normal way.
 */
export async function ensureDeviceLocationToken(
  getToken: () => Promise<string | null>
): Promise<string | null> {
  const cached = await getCachedDeviceLocationToken();
  if (cached) return cached;

  const authToken = await waitForClerkToken(getToken);
  if (!authToken) return null;

  try {
    const response = await fetch(getApiUrl("/api/user/device-location-token"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    if (!response.ok || !data.success || typeof data.token !== "string") {
      return null;
    }

    await SecureStore.setItemAsync(DEVICE_LOCATION_TOKEN_KEY, data.token);
    return data.token;
  } catch (error) {
    console.warn("[BackgroundLocation] Failed to fetch device location token", error);
    return null;
  }
}

/**
 * Checks whether the freelancer currently has at least one accepted
 * application — background tracking only runs when it could actually
 * matter, not for every signed-in freelancer at all times.
 */
export async function hasAcceptedApplication(
  getToken: () => Promise<string | null>
): Promise<boolean> {
  try {
    const token = await waitForClerkToken(getToken);
    if (!token) return false;

    const response = await fetch(getApiUrl("/api/applications/my"), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.data)) {
      return false;
    }

    return data.data.some((application: { status?: string }) => application.status === "accepted");
  } catch (error) {
    console.warn("[BackgroundLocation] Failed to check accepted applications", error);
    return false;
  }
}

TaskManager.defineTask(PROXIMITY_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn("[BackgroundLocation] Task error", error);
    return;
  }

  const { locations } = (data as { locations?: Location.LocationObject[] }) || {};
  const latest = locations?.[locations.length - 1];
  if (!latest) return;

  const token = await getCachedDeviceLocationToken();
  if (!token) return;

  try {
    await fetch(getApiUrl("/api/user/location/ping"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceLocationToken: token,
        latitude: latest.coords.latitude,
        longitude: latest.coords.longitude,
      }),
    });
  } catch (pingError) {
    console.warn("[BackgroundLocation] Ping failed", pingError);
  }
});

/**
 * Starts background proximity tracking. Requests background location
 * permission contextually (only when the caller — the profile toggle —
 * actually turns this on), not upfront at app launch.
 */
export async function startBackgroundProximityTracking(
  getToken: () => Promise<string | null>
): Promise<{ started: boolean; reason?: string }> {
  const token = await ensureDeviceLocationToken(getToken);
  if (!token) {
    return { started: false, reason: "Not signed in" };
  }

  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    const requested = await Location.requestForegroundPermissionsAsync();
    if (requested.status !== "granted") {
      return { started: false, reason: "Location permission denied" };
    }
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== "granted") {
    return { started: false, reason: "Background location permission denied" };
  }

  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
    PROXIMITY_LOCATION_TASK
  ).catch(() => false);

  if (!alreadyStarted) {
    await Location.startLocationUpdatesAsync(PROXIMITY_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 150,
      timeInterval: 120000,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Quickhands Pro",
        notificationBody: "Sharing your location so clients know when you're nearby a job.",
      },
    });
  }

  return { started: true };
}

export async function stopBackgroundProximityTracking() {
  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
    PROXIMITY_LOCATION_TASK
  ).catch(() => false);

  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(PROXIMITY_LOCATION_TASK);
  }
}
