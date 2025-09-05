import { useWindowSize } from 'usehooks-ts';

export function useAppWindowSize() {
  const { width, height } = useWindowSize();
  
  return {
    width,
    height,
    // App-specific breakpoint helpers
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    
    // Video-specific helpers  
    videoHeight: Math.min(height * 0.8, 800),
    videoWidth: width < 768 ? width - 32 : Math.min(width * 0.6, 400),
    
    // Layout helpers
    isLandscape: width > height,
    isPortrait: height > width,
    aspectRatio: width / height,
    
    // Grid helpers for feeds
    getGridColumns: () => {
      if (width < 640) return 1;
      if (width < 1024) return 2; 
      if (width < 1536) return 3;
      return 4;
    },
    
    // Chat layout helpers
    shouldShowSidebar: width >= 1024,
    chatWidth: width < 768 ? width : Math.min(400, width * 0.3)
  };
}