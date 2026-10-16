"use client";
import { useEffect, useState, type RefObject } from "react";

// Live WebM recordings may omit Duration. One native seek discovers the end;
// no decoding, second download, polling or perpetual timer is needed.
export function useAudioTimeline(
  ref: RefObject<HTMLAudioElement | null>,
  source: string | undefined,
) {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node || !source) return;
    let probing = false,
      attempted = false,
      restore = 0,
      resume = false;
    const finite = (n: number) => Number.isFinite(n) && n > 0 && n < 1e10;
    const readDuration = () => {
      if (finite(node.duration)) setDuration(node.duration);
      else if (node.seekable.length) {
        const end = node.seekable.end(node.seekable.length - 1);
        if (finite(end)) setDuration(end);
      }
    };
    const metadata = () => {
      readDuration();
      if (node.duration !== Infinity || attempted) return;
      attempted = true;
      restore = node.currentTime;
      resume = !node.paused;
      probing = true;
      try {
        node.currentTime = 1e10;
      } catch {
        probing = false;
      }
    };
    const seeked = () => {
      if (!probing) return;
      readDuration();
      if (!finite(node.duration) && finite(node.currentTime))
        setDuration(node.currentTime);
      probing = false;
      node.currentTime = restore;
      if (resume) void node.play().catch(() => {});
    };
    const update = () => {
      if (probing) return;
      readDuration();
      setPosition(Number.isFinite(node.currentTime) ? node.currentTime : 0);
    };
    const ended = () => {
      if (!probing && finite(node.currentTime)) setDuration(node.currentTime);
    };
    node.addEventListener("loadedmetadata", metadata);
    node.addEventListener("durationchange", readDuration);
    node.addEventListener("progress", readDuration);
    node.addEventListener("seeked", seeked);
    node.addEventListener("timeupdate", update);
    node.addEventListener("ended", ended);
    if (node.readyState >= 1) metadata();
    return () => {
      node.removeEventListener("loadedmetadata", metadata);
      node.removeEventListener("durationchange", readDuration);
      node.removeEventListener("progress", readDuration);
      node.removeEventListener("seeked", seeked);
      node.removeEventListener("timeupdate", update);
      node.removeEventListener("ended", ended);
    };
  }, [ref, source]);
  return { position, duration };
}
