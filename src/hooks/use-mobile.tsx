
"use client"

import * as React from "react"

// Default width to match Tailwind's `sm` breakpoint (640px) or a common mobile threshold.
const DEFAULT_MOBILE_WIDTH_THRESHOLD = 768 // md breakpoint

/**
 * Hook to determine if the current viewport width is considered "mobile".
 * @param {number} width - The breakpoint width (in pixels) to consider as mobile. Defaults to 768px (Tailwind's md).
 * @returns {boolean} True if the viewport width is less than or equal to the specified width, false otherwise.
 */
function useIsMobile(width: number = DEFAULT_MOBILE_WIDTH_THRESHOLD): boolean {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // Ensure window is defined (runs only on client-side)
    if (typeof window === "undefined") {
      return
    }

    const mql = window.matchMedia(`(max-width: ${width - 1}px)`) // Use width-1 for max-width to be < md

    const listener = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    // Set the initial state
    setIsMobile(mql.matches)

    // Add event listener
    try {
      mql.addEventListener("change", listener)
    } catch (error) {
      // Fallback for older browsers that don't support addEventListener
      mql.addListener(listener)
    }

    // Cleanup listener on component unmount
    return () => {
      try {
        mql.removeEventListener("change", listener)
      } catch (error) {
        // Fallback for older browsers
        mql.removeListener(listener)
      }
    }
  }, [width])

  return isMobile
}

export { useIsMobile }
