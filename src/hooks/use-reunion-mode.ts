"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { markAsRead, markAsSkipped } from "@/actions/reading";
import type { ReunionState, ReunionTestimony } from "@/lib/types";

// ---------------------------------------------------------------------------
// Scroll persistence helpers
// ---------------------------------------------------------------------------

function getScrollKey(planId: string): string {
  return `reunion_scroll_${planId}`;
}

function getDarkModeKey(): string {
  return "reunion_dark_mode";
}

interface SavedScroll {
  index: number;
  scrollY: number;
}

function saveScrollToStorage(planId: string, index: number): void {
  try {
    const data: SavedScroll = { index, scrollY: window.scrollY };
    localStorage.setItem(getScrollKey(planId), JSON.stringify(data));
  } catch {
    // localStorage may be unavailable
  }
}

function loadScrollFromStorage(planId: string): SavedScroll | null {
  try {
    const raw = localStorage.getItem(getScrollKey(planId));
    if (!raw) return null;
    return JSON.parse(raw) as SavedScroll;
  } catch {
    return null;
  }
}

function loadDarkMode(): boolean {
  try {
    return localStorage.getItem(getDarkModeKey()) === "true";
  } catch {
    return false;
  }
}

function saveDarkMode(value: boolean): void {
  try {
    localStorage.setItem(getDarkModeKey(), String(value));
  } catch {
    // localStorage may be unavailable
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseReunionModeParams {
  planId: string;
  serviceId: string;
  initialTestimonies: ReunionTestimony[];
}

interface UseReunionModeReturn extends ReunionState {
  goToNext: () => Promise<void>;
  goToPrevious: () => void;
  skipCurrent: () => Promise<void>;
  jumpTo: (index: number) => void;
  toggleDarkMode: () => void;
  startReunion: () => void;
  endReunion: () => void;
  isFirst: boolean;
  isLast: boolean;
  total: number;
  readCount: number;
}

export function useReunionMode({
  planId,
  serviceId,
  initialTestimonies,
}: UseReunionModeParams): UseReunionModeReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonies, setTestimonies] =
    useState<ReunionTestimony[]>(initialTestimonies);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Ref to avoid stale closures in event handlers
  const stateRef = useRef({ currentIndex, planId, isActive });
  stateRef.current = { currentIndex, planId, isActive };

  // ---------------------------------------------------------------------------
  // Initialize: restore dark mode preference & scroll position
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setIsDarkMode(loadDarkMode());

    const saved = loadScrollFromStorage(planId);
    if (saved && saved.index >= 0 && saved.index < initialTestimonies.length) {
      setCurrentIndex(saved.index);
    }
  }, [planId, initialTestimonies.length]);

  // ---------------------------------------------------------------------------
  // Debounced scroll saving
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isActive) return;

    let timeout: ReturnType<typeof setTimeout>;

    function handleScroll() {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        saveScrollToStorage(
          stateRef.current.planId,
          stateRef.current.currentIndex
        );
      }, 300);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isActive]);

  // ---------------------------------------------------------------------------
  // Page Visibility API: save on hidden, restore on visible
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isActive) return;

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        saveScrollToStorage(
          stateRef.current.planId,
          stateRef.current.currentIndex
        );
      } else if (document.visibilityState === "visible") {
        const saved = loadScrollFromStorage(stateRef.current.planId);
        if (saved) {
          setCurrentIndex(saved.index);
          requestAnimationFrame(() => window.scrollTo(0, saved.scrollY));
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive]);

  // ---------------------------------------------------------------------------
  // Save scroll position whenever currentIndex changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isActive) {
      saveScrollToStorage(planId, currentIndex);
    }
  }, [currentIndex, isActive, planId]);

  // ---------------------------------------------------------------------------
  // Update testimony status in local state
  // ---------------------------------------------------------------------------

  const updateTestimonyStatus = useCallback(
    (index: number, status: ReunionTestimony["status"]) => {
      setTestimonies((prev) =>
        prev.map((t, i) => (i === index ? { ...t, status } : t))
      );
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Navigation actions
  // ---------------------------------------------------------------------------

  const goToNext = useCallback(async () => {
    const state = stateRef.current;
    if (!state.isActive) return;

    const idx = state.currentIndex;
    const testimony = testimonies[idx];

    // Mark current testimony as read only if it is still pending
    if (testimony && testimony.status === "pending") {
      updateTestimonyStatus(idx, "read");
      // Fire server action (non-blocking for the UI)
      markAsRead(testimony.id, serviceId, planId).catch(console.error);
    }

    if (idx < testimonies.length - 1) {
      setCurrentIndex(idx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [testimonies, serviceId, planId, updateTestimonyStatus]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev > 0) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const skipCurrent = useCallback(async () => {
    const state = stateRef.current;
    if (!state.isActive) return;

    const idx = state.currentIndex;
    const testimony = testimonies[idx];

    if (testimony) {
      updateTestimonyStatus(idx, "skipped");
      markAsSkipped(testimony.id, serviceId, planId).catch(console.error);
    }

    if (idx < testimonies.length - 1) {
      setCurrentIndex(idx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [testimonies, serviceId, planId, updateTestimonyStatus]);

  const jumpTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < testimonies.length) {
        setCurrentIndex(index);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [testimonies.length]
  );

  // ---------------------------------------------------------------------------
  // Dark mode
  // ---------------------------------------------------------------------------

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      saveDarkMode(next);
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Reunion activation
  // ---------------------------------------------------------------------------

  const startReunion = useCallback(() => {
    setIsActive(true);
  }, []);

  const endReunion = useCallback(() => {
    setIsActive(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const total = testimonies.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const readCount = testimonies.filter((t) => t.status === "read").length;

  return {
    planId,
    currentIndex,
    testimonies,
    isDarkMode,
    isActive,
    goToNext,
    goToPrevious,
    skipCurrent,
    jumpTo,
    toggleDarkMode,
    startReunion,
    endReunion,
    isFirst,
    isLast,
    total,
    readCount,
  };
}
