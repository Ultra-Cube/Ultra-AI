// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { useEffect } from 'react';

/**
 * Custom hook to set document title dynamically.
 * Automatically appends " | OpenWA" suffix.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | OpenWA`;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
