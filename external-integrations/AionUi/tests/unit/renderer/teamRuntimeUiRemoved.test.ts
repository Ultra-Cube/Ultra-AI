// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { describe, expect, it } from 'vitest';
import zhCNTeamLocale from '@/renderer/services/i18n/locales/zh-CN/team.json';

describe('team runtime UI removal', () => {
  it('does not keep team runtime notice translations in the renderer locale', () => {
    expect('runtime' in zhCNTeamLocale).toBe(false);
  });
});
