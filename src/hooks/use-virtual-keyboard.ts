import { useEffect, useRef, useState } from 'react';

export function useVirtualKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const initialViewportHeight = useRef(0);
  const lastHeight = useRef(0);

  useEffect(() => {
    // Store initial viewport height on mount
    const currentHeight = window.visualViewport?.height || window.innerHeight;
    initialViewportHeight.current = currentHeight;
    lastHeight.current = currentHeight;

    const handleResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialViewportHeight.current - currentHeight;
      
      // Consider keyboard open if viewport height decreased by more than 150px
      // This threshold accounts for browser UI changes and provides a good balance
      const keyboardThreshold = 150;
      
      // Only update if there's a significant change to avoid flickering
      const significantChange = Math.abs(currentHeight - lastHeight.current) > 50;
      
      if (significantChange) {
        const newKeyboardState = heightDifference > keyboardThreshold;
        setIsKeyboardOpen(newKeyboardState);
        lastHeight.current = currentHeight;
      }
    };

    // Use visualViewport API if available (more accurate for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return { isKeyboardOpen };
} 