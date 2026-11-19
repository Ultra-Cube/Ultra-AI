// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { FONT_SIZE_KEYS, FONT_SIZE_SPECS, clampFontSize, type FontSizes } from '@/common/config/fontSizes';

/**
 * Write font sizes to the root element's CSS variables.
 * Values cross into Markdown shadow roots via ShadowView's variable injection.
 */
export function applyFontSizes(sizes: FontSizes, root: Document = document): void {
  for (const key of FONT_SIZE_KEYS) {
    const px = clampFontSize(key, sizes[key]);
    root.documentElement.style.setProperty(FONT_SIZE_SPECS[key].cssVar, `${px}px`);
  }
}
