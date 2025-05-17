
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export function useAutoHide(initialVisible: boolean = true, timeoutDuration: number = 2000) {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showAndResetTimer = useCallback(() => {
    setIsVisible(true);
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    activityTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, timeoutDuration);
  }, [timeoutDuration]);

  useEffect(() => {
    if (initialVisible) {
        showAndResetTimer(); 
    } else {
        setIsVisible(false);
    }

    const eventListeners = ['mousemove', 'mousedown', 'touchstart', 'keydown'];
    
    const handleActivity = () => {
      showAndResetTimer();
    };

    eventListeners.forEach(event => document.addEventListener(event, handleActivity));

    return () => {
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
      eventListeners.forEach(event => document.removeEventListener(event, handleActivity));
    };
  }, [initialVisible, showAndResetTimer]);

  return isVisible;
}
