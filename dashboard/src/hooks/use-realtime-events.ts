"use client";

import { useEffect, useRef } from "react";
import { loadStoredSession } from "@/lib/auth-session";

export interface RealtimeEvent {
  type: string;
  timestamp: string;
  logId?: string;
  transactionId?: string;
  providerIds?: string[];
}

interface UseRealtimeEventsOptions {
  throttleMs?: number;
}

export function useRealtimeEvents(
  onEvent: (event: RealtimeEvent) => void,
  options: UseRealtimeEventsOptions = {}
): void {
  const onEventRef = useRef(onEvent);
  const lastEventRef = useRef(0);
  const throttleMs = options.throttleMs ?? 800;

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let isStopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let activeController: AbortController | null = null;

    const connect = async () => {
      const session = loadStoredSession();
      if (!session || isStopped) {
        return;
      }

      const headers: HeadersInit =
        session.mode === "admin"
          ? { "X-Master-Key": session.credential }
          : { "X-API-Key": session.credential };

      const controller = new AbortController();
      activeController = controller;

      try {
        const response = await fetch("/api/events/stream", {
          method: "GET",
          headers,
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("failed to connect realtime stream");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (!isStopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let separatorIndex = buffer.indexOf("\n\n");
          while (separatorIndex >= 0) {
            const rawEvent = buffer.slice(0, separatorIndex);
            buffer = buffer.slice(separatorIndex + 2);
            separatorIndex = buffer.indexOf("\n\n");

            let eventType = "message";
            let dataPayload = "";
            const lines = rawEvent.split("\n");
            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (line.startsWith("event:")) {
                eventType = line.slice("event:".length).trim();
              } else if (line.startsWith("data:")) {
                dataPayload += line.slice("data:".length).trim();
              }
            }

            if (!dataPayload || eventType === "ready") {
              continue;
            }

            try {
              const parsed = JSON.parse(dataPayload) as RealtimeEvent;
              const now = Date.now();
              if (now-lastEventRef.current >= throttleMs) {
                lastEventRef.current = now;
                onEventRef.current(parsed);
              }
            } catch (_error) {
            }
          }
        }
      } catch (_error) {
      } finally {
        if (!isStopped) {
          reconnectTimer = setTimeout(connect, 1000);
        }
      }
    };

    connect();

    return () => {
      isStopped = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (activeController) {
        activeController.abort();
      }
    };
  }, [throttleMs]);
}
