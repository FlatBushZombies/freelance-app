import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type ServerMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  clientMessageId?: string;
};

type Options = {
  /** Long-running Node host (not Vercel serverless for production) */
  serverUrl: string;
  getToken: () => Promise<string | null>;
  conversationId: string;
  enabled?: boolean;
};

export function useMessagingSocket({
  serverUrl,
  getToken,
  conversationId,
  enabled = true,
}: Options) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !conversationId) return;

    let cancelled = false;
    let socket: Socket | null = null;

    (async () => {
      const token = await getToken();
      if (!token || cancelled) {
        setLastError('Not signed in');
        return;
      }

      socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        setLastError(null);
        socket!.emit('join_conversation', { conversationId }, (err: unknown) => {
          if (err) setLastError(JSON.stringify(err));
        });
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('connect_error', (e: Error) => {
        setLastError(e.message);
      });

      socket.on('message', (msg: ServerMessage) => {
        setMessages((prev) => [...prev, msg]);
      });
    })();

    return () => {
      cancelled = true;
      if (socket) {
        socket.emit('leave_conversation', { conversationId });
        socket.removeAllListeners();
        socket.close();
      }
      socketRef.current = null;
    };
  }, [serverUrl, getToken, conversationId, enabled]);

  const sendMessage = useCallback(
    (text: string, clientMessageId?: string) => {
      const s = socketRef.current;
      if (!s?.connected) {
        setLastError('Socket not connected');
        return;
      }
      s.emit(
        'send_message',
        { conversationId, text, ...(clientMessageId ? { clientMessageId } : {}) },
        (err: unknown) => {
          if (err) setLastError(JSON.stringify(err));
        }
      );
    },
    [conversationId]
  );

  return { connected, messages, sendMessage, lastError, socket: socketRef };
}