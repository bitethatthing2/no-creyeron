import { useMediaQuery } from 'usehooks-ts';

// Common breakpoints for your app
export const BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)'
} as const;

export function useResponsive() {
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const isTablet = useMediaQuery(BREAKPOINTS.tablet);
  const isDesktop = useMediaQuery(BREAKPOINTS.desktop);
  
  const isSm = useMediaQuery(BREAKPOINTS.sm);
  const isMd = useMediaQuery(BREAKPOINTS.md);
  const isLg = useMediaQuery(BREAKPOINTS.lg);
  const isXl = useMediaQuery(BREAKPOINTS.xl);

  return {
    isMobile,
    isTablet, 
    isDesktop,
    isSm,
    isMd,
    isLg,
    isXl,
    // Utility functions
    isSmallScreen: isMobile,
    isLargeScreen: isDesktop,
    // For video components
    shouldShowControls: !isMobile,
    preferVerticalLayout: isMobile,
    maxVideoHeight: isMobile ? '70vh' : '80vh'
  };
}