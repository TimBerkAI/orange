import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export const BREAKPOINTS = {
  mobile: "(max-width: 768px)",
  tablet: "(min-width: 769px) and (max-width: 1024px)",
  desktop: "(min-width: 1025px)",
  notMobile: "(min-width: 769px)",
} as const;

export function useIsMobile(): boolean {
  return useMediaQuery(BREAKPOINTS.mobile);
}

export function useIsTablet(): boolean {
  return useMediaQuery(BREAKPOINTS.tablet);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(BREAKPOINTS.desktop);
}
