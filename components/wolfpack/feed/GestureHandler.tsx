'use client';

import { useEffect, useRef, useState } from 'react';

interface GestureHandlerProps {
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onDoubleTap: () => void;
  onLongPress: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export default function GestureHandler({
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
  onLongPress,
  children,
  className = '',
  disabled = false
}: GestureHandlerProps) {
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Configuration
  const MIN_SWIPE_DISTANCE = 50;
  const MAX_SWIPE_TIME = 300;
  const DOUBLE_TAP_DELAY = 300;
  const LONG_PRESS_DELAY = 500;
  
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const getTouchPoint = (e: TouchEvent | React.TouchEvent): TouchPoint => {
    const touch = e.touches[0] || e.changedTouches[0];
    return {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const touchPoint = getTouchPoint(e);
    setTouchStart(touchPoint);
    setTouchEnd(null);
    setIsDragging(false);
    
    // Start long press timer
    const timer = setTimeout(() => {
      if (!isDragging) {
        onLongPress();
      }
    }, LONG_PRESS_DELAY);
    
    setLongPressTimer(timer);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !touchStart) return;
    
    const touchPoint = getTouchPoint(e);
    const distance = Math.sqrt(
      Math.pow(touchPoint.x - touchStart.x, 2) + 
      Math.pow(touchPoint.y - touchStart.y, 2)
    );
    
    // If moved more than a few pixels, it's a drag
    if (distance > 10) {
      setIsDragging(true);
      
      // Clear long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    }
    
    setTouchEnd(touchPoint);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled || !touchStart) return;
    
    const touchPoint = getTouchPoint(e);
    setTouchEnd(touchPoint);
    
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Check for double tap
    const now = Date.now();
    if (now - lastTap < DOUBLE_TAP_DELAY && !isDragging) {
      onDoubleTap();
      setLastTap(0);
      return;
    }
    setLastTap(now);
    
    // Check for swipe
    if (isDragging && touchEnd) {
      const deltaX = touchEnd.x - touchStart.x;
      const deltaY = touchEnd.y - touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const timeDiff = touchEnd.timestamp - touchStart.timestamp;
      
      if (distance > MIN_SWIPE_DISTANCE && timeDiff < MAX_SWIPE_TIME) {
        // Determine swipe direction
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        if (angle >= -45 && angle <= 45) {
          // Swipe right
          onSwipeRight();
        } else if (angle >= 135 || angle <= -135) {
          // Swipe left
          onSwipeLeft();
        } else if (angle >= 45 && angle <= 135) {
          // Swipe down
          onSwipeDown();
        } else if (angle >= -135 && angle <= -45) {
          // Swipe up
          onSwipeUp();
        }
      }
    }
    
    // Reset state
    setTouchStart(null);
    setTouchEnd(null);
    setIsDragging(false);
  };

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const touchPoint: TouchPoint = {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now()
    };
    
    setTouchStart(touchPoint);
    setTouchEnd(null);
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || !touchStart) return;
    
    const touchPoint: TouchPoint = {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now()
    };
    
    const distance = Math.sqrt(
      Math.pow(touchPoint.x - touchStart.x, 2) + 
      Math.pow(touchPoint.y - touchStart.y, 2)
    );
    
    if (distance > 10) {
      setIsDragging(true);
    }
    
    setTouchEnd(touchPoint);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (disabled || !touchStart) return;
    
    const touchPoint: TouchPoint = {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now()
    };
    
    setTouchEnd(touchPoint);
    
    // Check for double click
    const now = Date.now();
    if (now - lastTap < DOUBLE_TAP_DELAY && !isDragging) {
      onDoubleTap();
      setLastTap(0);
      return;
    }
    setLastTap(now);
    
    // Check for swipe
    if (isDragging && touchEnd) {
      const deltaX = touchPoint.x - touchStart.x;
      const deltaY = touchPoint.y - touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const timeDiff = touchPoint.timestamp - touchStart.timestamp;
      
      if (distance > MIN_SWIPE_DISTANCE && timeDiff < MAX_SWIPE_TIME) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        if (angle >= -45 && angle <= 45) {
          onSwipeRight();
        } else if (angle >= 135 || angle <= -135) {
          onSwipeLeft();
        } else if (angle >= 45 && angle <= 135) {
          onSwipeDown();
        } else if (angle >= -135 && angle <= -45) {
          onSwipeUp();
        }
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
    setIsDragging(false);
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          onSwipeUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onSwipeDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onSwipeLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSwipeRight();
          break;
        case ' ':
          e.preventDefault();
          onDoubleTap();
          break;
        case 'Enter':
          e.preventDefault();
          onLongPress();
          break;
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown);
      
      return () => {
        if (containerRef.current) {
          containerRef.current.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [disabled, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onDoubleTap, onLongPress]);

  return (
    <div
      ref={containerRef}
      className={`touch-none select-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      tabIndex={0}
      style={{
        touchAction: disabled ? 'auto' : 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {children}
    </div>
  );
}