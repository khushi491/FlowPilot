"use client";

import { useEffect, useRef, useState } from "react";

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

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useRunSocket(runId?: string | null) {
  const [events, setEvents] = useState<RunSocketEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!runId) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("flowpilot_token") : null;
    const url = `${WS_URL}/ws/runs/${runId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    const socket = new WebSocket(url);
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

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [runId]);

  return { events, connected, status };
}
