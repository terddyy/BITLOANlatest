import { useEffect, useRef, useState } from "react";

export function useWebSocket(path: string, onMessage: (data: any) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname; // Get hostname without port
    const port = window.location.port ? `:${window.location.port}` : ''; // Get port if available
    const wsUrl = `${protocol}//${hostname}${port}${path}`;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 10; // To prevent infinite loops
    const RECONNECT_INTERVAL = 3000; // 3 seconds

    const connect = () => {
      setConnectionStatus('connecting');
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Reconnect after 3 seconds, up to MAX_RECONNECT_ATTEMPTS
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
          setTimeout(() => {
            if (ws.current?.readyState === WebSocket.CLOSED) {
              connect();
            }
          }, RECONNECT_INTERVAL);
        } else {
          console.log('Max WebSocket reconnect attempts reached. Please refresh the page.');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [path, onMessage]);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  return { connectionStatus, sendMessage };
}
