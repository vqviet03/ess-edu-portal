"use client";
import {presenceContext,PRESENCE_CONTEXT_EVENT,receivePresence,presenceConnection,type PresenceSignal} from "@/features/presence/state";
import {showNoticeToast} from "@/features/notifications/events";

import { useEffect } from "react";
import type { Notification } from "@/features/materials/models";
import {
  noticeReceived,
  noticeSnapshotReceived,
} from "@/features/materials/notification-state";
import { realtimeTags } from "@/api/realtime-tags";
import { api } from "@/api/api";
import { apiConfiguration } from "@/api/config";
import { useAppDispatch, useAppSelector } from "@/store";
import { loggedOut } from "@/store/auth";
type Signal = {
  classId?:string;userId?:string;connectionId?:string;online?:boolean;seenAt?:string;
  type?: string;
  id?: string;
  version?: number;
  href?: string;
  operationId?: string;
  title?: string;
  isRead?: boolean;
  createdAt?: string;
};
type Frame = {
  type: string;
  cursor?: string;
  data?: Signal & {
    items?: Notification[];
    nextCursor?: string | null;
    unreadCount?: number;
  };
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
      presenceConnection(false);
    };
    const sendContext=()=>{if(socket?.readyState===WebSocket.OPEN){presenceConnection(false);presenceConnection(true);socket.send(JSON.stringify({type:"PRESENCE",classId:presenceContext()}));}else if(!disposed&&!document.hidden&&navigator.onLine&&!socket)open();};
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
          if(frame.type==="READY")sendContext();
          if(frame.type==="PRESENCE_RESET")presenceConnection(false);
          if(frame.type==="PRESENCE" && frame.data)receivePresence(frame.data as PresenceSignal);
          if (
            (frame.type === "NOTIFICATION" ||
              frame.type === "RESOURCE_CHANGED") &&
            frame.data
          ) {
            const item = frame.data;
            if (frame.type === "NOTIFICATION") {
              const isNew = !item.id || !notices.has(item.id);
              if (
                item.id &&
                item.title &&
                item.createdAt &&
                item.type &&
                typeof item.isRead === "boolean" &&
                typeof item.version === "number" &&
                (notices.get(item.id) ?? 0) < item.version
              ) {
                dispatch(noticeReceived(item as Notification));
              }
              if (item.id) notices.set(item.id, item.version ?? 1);
              if (isNew) {refresh(item, "NOTIFICATION");showNoticeToast(item as Notification);}
            } else refresh(item, "RESOURCE_CHANGED");
          }
          if (frame.type === "NOTIFICATIONS") {
            const items = frame.data?.items ?? [];
            dispatch(
              noticeSnapshotReceived({
                items,
                nextCursor: frame.data?.nextCursor ?? null,
                unreadCount: frame.data?.unreadCount ?? 0,
              }),
            );
            for (const item of items) {
              if (receivedSnapshot && !notices.has(item.id)) refresh(item);
              notices.set(item.id, item.version);
            }
            receivedSnapshot = true;
          }
          while (notices.size > 1024)
            notices.delete(notices.keys().next().value!);
        } catch {
          /* Ignore malformed frames; never log auth or private data. */
        }
      };
      current.onclose = (event) => {
        if (socket === current) {socket = undefined;presenceConnection(false);}
        if (event.code === 1008 && event.reason === "UNAUTHORIZED")
          dispatch(loggedOut("Phiên đăng nhập đã hết hạn."));
      };
    };
    const resume = () => {
      if (document.hidden || !navigator.onLine) pause();
      else open();
    };
    window.addEventListener(PRESENCE_CONTEXT_EVENT,sendContext);
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    window.addEventListener("offline", pause);
    window.addEventListener("pageshow", resume);
    window.addEventListener("pagehide", pause);
    open();
    return () => {
      disposed = true;
      pause();
      window.removeEventListener(PRESENCE_CONTEXT_EVENT,sendContext);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", pause);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("pagehide", pause);
    };
  }, [token, dispatch]);
  return null;
}
