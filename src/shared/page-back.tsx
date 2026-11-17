"use client";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BackAction } from "./back-action";

/** Entry pages of the student portal; every other page shows Back. */
const rootPages = [
  "/",
  "/home/",
  "/home/thread/",
  "/dashboard/",
  "/login/",
  "/auth/link/",
];

/**
 * Where Back goes when the browser has no in-app history entry (deep link,
 * reload in a new tab). Returns `null` for entry pages, which have no Back.
 * Keep every page's parent here so pages never render their own back links.
 */
export function backFallback(
  pathname: string,
  params: URLSearchParams,
): string | null {
  if (rootPages.includes(pathname)) return null;
  const classId = params.get("classId");
  const inClass = (path: string) =>
    classId ? `${path}?${new URLSearchParams({ classId })}` : path;
  const [section] = pathname.split("/").filter(Boolean);
  switch (section) {
    case "post":
      return inClass("/home/thread/");
    case "assignment":
    case "assignment-report":
      return inClass("/home/assignments/");
    case "materials":
      return inClass("/home/files/");
    case "home":
      if (pathname.startsWith("/home/rewards/gifts/"))
        return inClass("/home/rewards/");
      return inClass("/home/");
    default:
      return "/home/";
  }
}

/** The fallback for the current page, or `null` on entry pages. */
export function useBackFallback() {
  const pathname = usePathname(),
    params = useSearchParams();
  return backFallback(pathname, new URLSearchParams(params.toString()));
}

/** The single Back control, rendered by the common page header on every non-entry page. */
export function PageBack({ otherwise = null }: { otherwise?: ReactNode }) {
  const fallback = useBackFallback();
  return fallback ? <BackAction fallback={fallback} /> : otherwise;
}
