import { useCallback, useEffect, useState } from 'react';

export type ChatUser = {
  clerkId: string;
  displayName: string;
  email: string;
  imageUrl: string | null;
  skills: string | null;
};

type Options = {
  apiUrl: string;
  getToken: () => Promise<string | null>;
};

export function useMessagingUsers({ apiUrl, getToken }: Options) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Not signed in');
        return;
      }
      const base = apiUrl.replace(/\/$/, '');
      const res = await fetch(`${base}/api/messaging/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load users');
      setUsers(data.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { users, loading, error, refresh };
}