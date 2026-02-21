'use client';

// In the Name of God, the Creative, the Originator
import { useState, useEffect } from 'react';

export function useRandomHeroBackground() {
  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    const getRandomBg = (isPortrait: boolean) => {
      const landscapes = ['/bg1.jpg', '/bg2.jpg', '/bg3.jpg', '/bg4.jpg'];
      const portraits = ['/bg5.jpg', '/bg6.JPG'];
      const arr = isPortrait ? portraits : landscapes;
      return arr[Math.floor(Math.random() * arr.length)];
    };

    const updateBg = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      setBgImage(getRandomBg(isPortrait));
    };

    updateBg(); // Initial run

    const mql = window.matchMedia('(orientation: portrait)');
    if (mql.addEventListener) {
      mql.addEventListener('change', updateBg);
      return () => mql.removeEventListener('change', updateBg);
    } else {
      // Fallback for older browsers
      mql.addListener(updateBg);
      return () => mql.removeListener(updateBg);
    }
  }, []);

  return bgImage;
}
