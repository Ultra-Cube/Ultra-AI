// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import type { TChatConversation } from '@/common/config/storage';

const LEGACY_READ_ONLY_CONVERSATION_TYPES = new Set(['openclaw-gateway', 'nanobot', 'remote', 'gemini', 'codex']);

export const isConversationProcessing = (conversation?: Pick<TChatConversation, 'runtime' | 'status'> | null) => {
  return conversation?.runtime?.is_processing === true;
};

export const isLegacyReadOnlyConversationType = (type?: string | null) => {
  return Boolean(type && LEGACY_READ_ONLY_CONVERSATION_TYPES.has(type));
};
