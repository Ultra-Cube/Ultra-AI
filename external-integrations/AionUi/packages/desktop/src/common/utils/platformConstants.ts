// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * New API 网关平台标识
 * New API gateway platform identifier
 */
export const NEW_API_PLATFORM_ID = 'new-api';

/**
 * 检查平台是否为 New API 网关类型
 * Check if platform is New API gateway type
 */
export const isNewApiPlatform = (platform: string): boolean => {
  return platform === NEW_API_PLATFORM_ID;
};
