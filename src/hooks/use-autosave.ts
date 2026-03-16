"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseAutosaveReturn {
  content: string;
  setContent: (value: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
}

/**
 * Hook for debounced auto-save functionality.
 * Calls `saveFn` after `delay` ms of inactivity following a content change.
 */
export function useAutosave(
  saveFn: (content: string) => Promise<void>,
  delay: number = 2000
): UseAutosaveReturn {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef(saveFn);
  const contentRef = useRef(content);
  const isInitialMount = useRef(true);

  // Keep refs up to date
  saveFnRef.current = saveFn;
  contentRef.current = content;

  const save = useCallback(async (value: string) => {
    setIsSaving(true);
    try {
      await saveFnRef.current(value);
      setLastSaved(new Date());
    } catch {
      // Errors are handled by the server action caller
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Debounce effect: schedule save when content changes
  useEffect(() => {
    // Skip saving on the initial mount (when content is set from server data)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      save(content);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content, delay, save]);

  // Save immediately on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Fire a final save with the latest content
        saveFnRef.current(contentRef.current);
      }
    };
  }, []);

  return { content, setContent, isSaving, lastSaved };
}
