"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { wsBaseUrl } from "@/lib/client-config";

export interface RunSocketEvent {
  type: string;
  run_id?: string;
  status?: string;
  node_id?: string;
  node_run_id?: string;
  message?: string;
  output?: unknown;
  error?: string;
  logs?: Array<Record<string, unknown>>;
  timestamp?: string;
  [key: string]: unknown;
}

export function useRunSocket(runId?: string | null) {
  const [events, setEvents] = useState<RunSocketEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    let socket: WebSocket | null = null;

    const connect = async () => {
      try {
        const { access_token } = await api.fetchWsToken();
        if (cancelled) return;
        const url = `${wsBaseUrl()}/ws/runs/${runId}?token=${encodeURIComponent(access_token)}`;
        socket = new WebSocket(url);
        socketRef.current = socket;
        socket.onopen = () => setConnected(true);
        socket.onclose = () => setConnected(false);
        socket.onerror = () => setConnected(false);
        socket.onmessage = (message) => {
          try {
            const event = JSON.parse(message.data) as RunSocketEvent;
            if (event.type === "ping") return;
            setEvents((prev) => [...prev, event]);
            if (event.status) setStatus(event.status);
          } catch {
            /* ignore malformed */
          }
        };
      } catch {
        if (!cancelled) setConnected(false);
      }
    };

    void connect();

    return () => {
      cancelled = true;
      socket?.close();
      socketRef.current = null;
    };
  }, [runId]);

  return { events, connected, status };
}
