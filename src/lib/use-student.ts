"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, session } from "./api";
import { ApiError, type Student } from "./api/types";

export function useStudent() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const logout = useCallback(() => {
    session.clear();
    setStudent(null); setToken("");
    router.replace("/");
  }, [router]);
  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) { logout(); return ""; }
    return error instanceof Error ? error.message : "Không tải được dữ liệu. Vui lòng thử lại.";
  }, [logout]);

  useEffect(() => {
    const jwt = session.get();
    if (!jwt) { router.replace("/"); return; }
    const controller = new AbortController();
    setToken(jwt); setLoading(true); setError("");
    api.getStudent(jwt, controller.signal).then(setStudent).catch(error => {
      if (!controller.signal.aborted) setError(handleError(error));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [router, handleError, attempt]);

  return { student, token, loading, error, logout, handleError, retry: () => setAttempt(n => n + 1) };
}
