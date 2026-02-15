/**
 * @file use-mobile.ts
 * @description React hook to detect whether the current viewport is mobile-sized.
 *
 * Uses `window.matchMedia` to listen for viewport width changes.
 * Returns `true` when the viewport is narrower than 768px.
 *
 * ## Usage
 * ```tsx
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 * ```
 */

import * as React from "react";

/** Breakpoint in pixels below which the device is considered "mobile". */
const MOBILE_BREAKPOINT = 768;

/** Returns `true` if the viewport width is below the mobile breakpoint. */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
