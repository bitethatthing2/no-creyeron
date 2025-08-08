import { useEffect, RefObject, useCallback, useRef } from 'react';

/**
 * Hook that handles click outside of the passed ref
 * @param ref - React ref object to detect clicks outside of
 * @param handler - Callback function to run when a click outside is detected
 */
export function useOnClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  // Use ref to store the latest handler to avoid stale closures
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  // Memoize the listener to prevent unnecessary re-creation
  const listener = useCallback((event: MouseEvent | TouchEvent) => {
    // Do nothing if clicking ref's element or descendent elements
    if (!ref.current || ref.current.contains(event.target as Node)) {
      return;
    }
    
    handlerRef.current(event);
  }, [ref]);

  useEffect(() => {
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [listener]); // Only depend on memoized listener
}
