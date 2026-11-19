// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  codeEditorFontTheme,
  getCodeEditorBaseTheme,
} from '@/renderer/pages/conversation/Preview/theme/codeEditorTheme';

describe('codeEditorTheme', () => {
  it('builds a non-null font theme extension', () => {
    expect(codeEditorFontTheme()).toBeTruthy();
  });

  it('maps mode to the base theme identifier (seam for future schemes)', () => {
    expect(getCodeEditorBaseTheme('dark')).toBe('dark');
    expect(getCodeEditorBaseTheme('light')).toBe('light');
  });
});
