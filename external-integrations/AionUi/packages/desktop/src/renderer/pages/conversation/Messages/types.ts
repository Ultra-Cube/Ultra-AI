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
 * Type definitions for message tool results
 * 消息工具结果类型定义
 */

export interface ImageGenerationResult {
  img_url?: string;
  relative_path?: string;
  error?: string;
}

export interface WriteFileResult {
  file_diff: string;
  file_name: string;
  [key: string]: unknown;
}
