"use client";
import { useEffect } from "react";
import { realtimeTags } from "@/api/realtime-tags";
import { api } from "@/api/api";
import { apiConfiguration } from "@/api/config";
import { useAppDispatch, useAppSelector } from "@/store";
import { loggedOut } from "@/store/auth";
type Signal = {
  type?: string;
  id?: string;
  version?: number;
  href?: string;
  operationId?: string;
};
type Frame = {
  type: string;
  cursor?: string;
  data?: Signal & { items?: Signal[] };
};
export function StudentRealtime() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) =>
    s.auth.status === "authenticated" ? s.auth.accessToken : null,
  );
  useEffect(() => {
    if (!token || apiConfiguration.error) return;
    let socket: WebSocket | undefined,
      disposed = false,
      cursor: string | undefined,
      receivedSnapshot = false;
    const processed = new Set<string>(),
      notices = new Map<string, number>();
    const refresh = (
      signal: Signal,
      kind: "NOTIFICATION" | "RESOURCE_CHANGED" = "NOTIFICATION",
    ) => {
      const key =
        signal.operationId ||
        (signal.id ? `${signal.id}:${signal.version}` : undefined);
      if (key && processed.has(key)) return;
      if (key) {
        processed.add(key);
        if (processed.size > 256)
          processed.delete(processed.values().next().value!);
      }
      let classId: string | null = null;
      try {
        classId = new URL(
          signal.href ?? "",
          window.location.origin,
        ).searchParams.get("classId");
      } catch {}
      dispatch(
        api.util.invalidateTags(realtimeTags(kind, classId, signal.type)),
      );
    };
    const pause = () => {
      if (!socket) return;
      socket.onclose = null;
      socket.onmessage = null;
      socket.onopen = null;
      socket.close();
      socket = undefined;
    };
    const open = () => {
      if (disposed || document.hidden || !navigator.onLine || socket) return;
      const url = new URL(apiConfiguration.baseUrl + "/events/ws");
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      const current = new WebSocket(url);
      socket = current;
      current.onopen = () =>
        current.send(
          JSON.stringify({ type: "AUTH", accessToken: token, cursor }),
        );
      current.onmessage = (event) => {
        try {
          const frame = JSON.parse(String(event.data)) as Frame;
          if (frame.cursor) cursor = frame.cursor;
          if (
            (frame.type === "NOTIFICATION" ||
              frame.type === "RESOURCE_CHANGED") &&
            frame.data
          )
            refresh(
              frame.data,
              frame.type as "NOTIFICATION" | "RESOURCE_CHANGED",
            );
          if (frame.type === "NOTIFICATIONS") {
            const changed = (frame.data?.items ?? []).some(
              (item) => item.id && notices.get(item.id) !== (item.version ?? 1),
            );
            for (const item of frame.data?.items ?? [])
              if (item.id) notices.set(item.id, item.version ?? 1);
            if (receivedSnapshot && changed) refresh({});
            receivedSnapshot = true;
          }
        } catch {
          /* Ignore malformed frames; never log auth or private data. */
        }
      };
      current.onclose = (event) => {
        if (socket === current) socket = undefined;
        if (event.code === 1008 && event.reason === "UNAUTHORIZED")
          dispatch(loggedOut("Phiên đăng nhập đã hết hạn."));
      };
    };
    const resume = () => {
      if (document.hidden || !navigator.onLine) pause();
      else open();
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    window.addEventListener("offline", pause);
    window.addEventListener("pageshow", resume);
    window.addEventListener("pagehide", pause);
    open();
    return () => {
      disposed = true;
      pause();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", pause);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("pagehide", pause);
    };
  }, [token, dispatch]);
  return null;
}
