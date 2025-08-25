import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebSocketOptions {
  path: string;
  onMessage: (data: any) => void;
  token?: string | null; // Optional token for authentication
}

export function useWebSocket({ path, onMessage, token }: UseWebSocketOptions) {
  const ws = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isConnecting = useRef(false); // To prevent multiple simultaneous connection attempts

  const MAX_RECONNECT_ATTEMPTS = 50;
  const BASE_RECONNECT_INTERVAL = 1000; // 1 second base interval

  const connect = useCallback(() => {
    // Prevent connecting if already connecting or connected
    if (isConnecting.current || (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING))) {
      return;
    }

    const baseWsUrl = import.meta.env.VITE_WS_URL;
    // console.log("WebSocket: VITE_WS_URL from env:", baseWsUrl); // Remove console log

    if (!baseWsUrl) {
      console.error("WebSocket: VITE_WS_URL environment variable is not set.");
      setConnectionStatus('disconnected');
      return;
    }

    isConnecting.current = true;
    setConnectionStatus('connecting');

    // Construct the WebSocket URL with token if provided
    const wsUrl = `${baseWsUrl}${path}${token ? `?token=${token}` : ''}`;

    console.log(`WebSocket: Attempting to connect to ${wsUrl} (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})...`);

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket: Connected');
      setConnectionStatus('connected');
      reconnectAttempts.current = 0; // Reset attempts on successful connection
      isConnecting.current = false;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket: Failed to parse message:', error);
      }
    };

    ws.current.onclose = (event) => {
      console.log(`WebSocket: Closed (Code: ${event.code}, Reason: ${event.reason || 'No Reason'})`);
      setConnectionStatus('disconnected');
      isConnecting.current = false;

      // Reconnect with exponential backoff
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current++;
        const delay = BASE_RECONNECT_INTERVAL * Math.pow(2, reconnectAttempts.current - 1); // Exponential backoff
        reconnectTimeout.current = setTimeout(() => {
          // Only try to connect if still disconnected or closed, and not already connecting
          if (ws.current?.readyState === WebSocket.CLOSED && !isConnecting.current) {
            connect();
          }
        }, Math.min(delay, 30000)); // Max 30 seconds delay
      } else {
        console.log('WebSocket: Max reconnect attempts reached. Will not attempt further reconnections.');
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket: Error:', error);
      isConnecting.current = false;
      // onclose will typically be called after onerror, so no need to set status here again
    };
  }, [path, onMessage, token]); // Dependencies for useCallback

  useEffect(() => {
    connect();

    return () => {
      // Clear any pending reconnection attempts
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }

      // Close WebSocket only if it's open or connecting
      if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
        console.log('WebSocket: Cleaning up connection.');
        ws.current.close();
      }
      ws.current = null; // Ensure ws.current is nullified after cleanup
      isConnecting.current = false; // Reset connecting state
    };
  }, [connect]); // Dependency: connect function

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket: Cannot send message, connection is not OPEN.');
    }
  };

  return { connectionStatus, sendMessage };
}
