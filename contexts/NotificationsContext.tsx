import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { io, Socket } from "socket.io-client";
import Toast from "react-native-toast-message";
import { API_BASE_URL, getApiUrl } from "@/lib/fetch";

export interface Notification {
  id: number;
  userId: number | string;
  jobId: number;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  connected: boolean;
  loading: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const SOCKET_URL = API_BASE_URL.replace(/\/$/, "").replace(/\/api\/?$/, "");
const POLL_INTERVAL_MS = 15000;

function isUnsupportedSocketHost(serverUrl: string) {
  return /(^|:\/\/)[^/]*vercel\.app(\/|$)/i.test(serverUrl);
}

function sortNotifications(items: Notification[]) {
  return [...items].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function mergeNotifications(current: Notification[], incoming: Notification[]) {
  const byId = new Map<number, Notification>();

  for (const item of current) {
    byId.set(item.id, item);
  }

  for (const item of incoming) {
    const existing = byId.get(item.id);
    byId.set(item.id, existing ? { ...existing, ...item } : item);
  }

  return sortNotifications(Array.from(byId.values()));
}

function toastForMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("accepted")) {
    return { type: "success" as const, title: "Offer accepted" };
  }

  if (normalized.includes("rejected")) {
    return { type: "error" as const, title: "Offer rejected" };
  }

  if (normalized.includes("phone number") || normalized.includes("contact")) {
    return { type: "success" as const, title: "Contact shared" };
  }

  return { type: "info" as const, title: "New notification" };
}

function showToastForNotification(notification: Notification) {
  const toast = toastForMessage(notification.message);
  Toast.show({
    type: toast.type,
    text1: toast.title,
    text2: notification.message,
    visibilityTime: 3500,
  });
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const getTokenRef = useRef(getToken);
  const userIdRef = useRef<string | null>(user?.id ?? null);
  const hasLoadedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const token = await getTokenRef.current();
      const response = await fetch(getApiUrl(`/api/notifications/by-clerk/${user.id}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (!response.ok || !data.success || !Array.isArray(data.notifications)) {
        throw new Error(data?.message || data?.error || "Failed to fetch notifications");
      }

      setNotifications((current) => {
        const knownIds = new Set(current.map((notification) => notification.id));
        const nextNotifications = mergeNotifications(current, data.notifications);
        const newestFreshNotification = data.notifications.find(
          (notification: Notification) => !knownIds.has(notification.id)
        );

        if (hasLoadedRef.current && appStateRef.current === "active" && newestFreshNotification) {
          showToastForNotification(newestFreshNotification);
        }

        return nextNotifications;
      });
      hasLoadedRef.current = true;
    } catch (error) {
      console.error("[Notifications] Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    void refreshNotifications();

    const interval = setInterval(() => {
      void refreshNotifications();
    }, POLL_INTERVAL_MS);

    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active") {
        void refreshNotifications();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshNotifications, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setConnected(false);
      return;
    }

    if (isUnsupportedSocketHost(SOCKET_URL)) {
      setConnected(false);
      return;
    }

    let cancelled = false;
    let socket: Socket | null = null;

    (async () => {
      const token = await getTokenRef.current();
      if (!token || cancelled) {
        return;
      }

      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socket.on("connect", () => {
        if (!cancelled) {
          setConnected(true);
        }
      });

      socket.on("disconnect", () => {
        if (!cancelled) {
          setConnected(false);
        }
      });

      socket.on("connect_error", (error: Error) => {
        console.warn("[Notifications] Socket connection error", error.message);
      });

      socket.on("notification:new", (payload: { notification?: Notification }) => {
        const notification = payload?.notification;
        if (!notification) {
          return;
        }

        setNotifications((current) => {
          const merged = mergeNotifications(current, [notification]);
          return merged;
        });

        if (hasLoadedRef.current && appStateRef.current === "active") {
          showToastForNotification(notification);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (socket) {
        socket.removeAllListeners();
        socket.close();
      }
      setConnected(false);
    };
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );

    try {
      const token = await getTokenRef.current();
      const response = await fetch(getApiUrl(`/api/notifications/${notificationId}/read`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification ${notificationId} as read`);
      }
    } catch (error) {
      console.error("[Notifications] Error marking notification as read", error);
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    const clerkId = userIdRef.current;
    if (!clerkId) {
      return;
    }

    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));

    try {
      const token = await getTokenRef.current();
      const response = await fetch(getApiUrl(`/api/notifications/by-clerk/${clerkId}/read`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
    } catch (error) {
      console.error("[Notifications] Error marking all notifications as read", error);
      void refreshNotifications();
    }
  }, [refreshNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      connected,
      loading,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
    }),
    [connected, loading, markAllAsRead, markAsRead, notifications, refreshNotifications]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }

  return context;
}
