"use client";

import * as React from "react";
import { debugLog } from "@/lib/debug";

/**
 * Hook that handles click outside of the passed ref
 * Properly typed and enhanced with additional features
 * @param ref - React ref object to detect clicks outside of
 * @param handler - Callback function to run when a click outside is detected
 * @param options - Optional configuration for the hook
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T> | React.RefObject<T>[],
  handler: (event: MouseEvent | TouchEvent) => void,
  options?: {
    enabled?: boolean;
    mouseEvent?: "mousedown" | "mouseup" | "click";
    touchEvent?: "touchstart" | "touchend";
    excludeRefs?: React.RefObject<HTMLElement>[];
    excludeClassNames?: string[];
    excludeIds?: string[];
  },
): void {
  // Configuration with defaults
  const enabled = options?.enabled ?? true;
  const mouseEvent = options?.mouseEvent ?? "mousedown";
  const touchEvent = options?.touchEvent ?? "touchstart";
  const excludeRefs = React.useMemo(
    () => options?.excludeRefs ?? [],
    [options?.excludeRefs],
  );
  const excludeClassNames = React.useMemo(
    () => options?.excludeClassNames ?? [],
    [options?.excludeClassNames],
  );
  const excludeIds = React.useMemo(
    () => options?.excludeIds ?? [],
    [options?.excludeIds],
  );

  // Normalize refs to array for easier handling, memoized for stable reference
  const refs = React.useMemo(() => Array.isArray(ref) ? ref : [ref], [ref]);

  // Use ref to store the latest handler to avoid stale closures
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  // Memoize the listener to prevent unnecessary re-creation
  const listener = React.useCallback((event: MouseEvent | TouchEvent) => {
    if (!enabled) return;

    const target = event.target as Node;

    // Check if clicking inside any of the main refs
    for (const currentRef of refs) {
      if (currentRef.current && currentRef.current.contains(target)) {
        return;
      }
    }

    // Check if clicking inside any excluded refs
    for (const excludeRef of excludeRefs) {
      if (excludeRef.current && excludeRef.current.contains(target)) {
        return;
      }
    }

    // Check if target has any excluded class names
    if (target instanceof HTMLElement && excludeClassNames.length > 0) {
      for (const className of excludeClassNames) {
        if (
          target.classList.contains(className) ||
          target.closest(`.${className}`)
        ) {
          return;
        }
      }
    }

    // Check if target has any excluded IDs
    if (target instanceof HTMLElement && excludeIds.length > 0) {
      for (const id of excludeIds) {
        if (target.id === id || target.closest(`#${id}`)) {
          return;
        }
      }
    }

    // If we reach here, the click was outside all refs and exclusions
    handlerRef.current(event);

    debugLog.custom(
      "🖱️",
      "Click outside detected",
      {
        targetElement: target instanceof HTMLElement
          ? target.tagName
          : "unknown",
        targetId: target instanceof HTMLElement ? target.id : undefined,
        targetClasses: target instanceof HTMLElement
          ? target.className
          : undefined,
      },
    );
  }, [refs, enabled, excludeRefs, excludeClassNames, excludeIds]);

  React.useEffect(() => {
    if (!enabled) return;

    // Add event listeners
    document.addEventListener(mouseEvent, listener);
    document.addEventListener(touchEvent, listener, { passive: true });

    // Cleanup
    return () => {
      document.removeEventListener(mouseEvent, listener);
      document.removeEventListener(touchEvent, listener);
    };
  }, [enabled, mouseEvent, touchEvent, listener]);
}

/**
 * Hook that handles escape key press
 * Often used together with useOnClickOutside for closing modals/dropdowns
 */
export function useEscapeKey(
  handler: (event: KeyboardEvent) => void,
  options?: {
    enabled?: boolean;
    preventDefault?: boolean;
  },
): void {
  const enabled = options?.enabled ?? true;
  const preventDefault = options?.preventDefault ?? true;

  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Esc") {
        if (preventDefault) {
          event.preventDefault();
        }
        handlerRef.current(event);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [enabled, preventDefault]);
}

/**
 * Combined hook for common modal/dropdown behavior
 * Handles both click outside and escape key
 */
export function useCloseOnInteraction<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T> | React.RefObject<T>[],
  onClose: () => void,
  options?: {
    enabled?: boolean;
    closeOnEscape?: boolean;
    closeOnClickOutside?: boolean;
    excludeRefs?: React.RefObject<HTMLElement>[];
    excludeClassNames?: string[];
    excludeIds?: string[];
  },
): void {
  const enabled = options?.enabled ?? true;
  const closeOnEscape = options?.closeOnEscape ?? true;
  const closeOnClickOutside = options?.closeOnClickOutside ?? true;

  useOnClickOutside(
    ref,
    onClose,
    {
      enabled: enabled && closeOnClickOutside,
      excludeRefs: options?.excludeRefs,
      excludeClassNames: options?.excludeClassNames,
      excludeIds: options?.excludeIds,
    },
  );

  useEscapeKey(
    onClose,
    {
      enabled: enabled && closeOnEscape,
    },
  );
}

/**
 * Hook to detect clicks on a specific element
 * Useful for detecting when to open something
 */
export function useOnClickInside<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
  options?: {
    enabled?: boolean;
    mouseEvent?: "mousedown" | "mouseup" | "click";
    touchEvent?: "touchstart" | "touchend";
  },
): void {
  const enabled = options?.enabled ?? true;
  const mouseEvent = options?.mouseEvent ?? "click";
  const touchEvent = options?.touchEvent ?? "touchstart";

  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;

  React.useEffect(() => {
    if (!enabled || !ref.current) return;

    const element = ref.current;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      handlerRef.current(event);
    };

    element.addEventListener(mouseEvent, handleClick as EventListener);
    element.addEventListener(touchEvent, handleClick as EventListener, {
      passive: true,
    });

    return () => {
      element.removeEventListener(mouseEvent, handleClick as EventListener);
      element.removeEventListener(touchEvent, handleClick as EventListener);
    };
  }, [enabled, ref, mouseEvent, touchEvent]);
}
