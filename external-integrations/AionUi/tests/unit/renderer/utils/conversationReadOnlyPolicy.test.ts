// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
// ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
// ║ ██║   ██║██║     ███████║██████╔╝                                        ║
// ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
// ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
// ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
// ║                                                                          ║
// ║ Project   : Ultra AI — Proprietary AI Platform                           ║
// ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
// ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
// ║ GitHub Org: github.com/Ultra-Cube                                        ║
// ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
// ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
// ║ [UCUBETECH-COPYRIGHT]                                                    ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { describe, expect, it } from 'vitest';

import { isLegacyReadOnlyConversationType } from '@/renderer/pages/conversation/utils/conversationRuntime';

describe('conversation read-only policy', () => {
  it('marks deprecated runtime conversations as read-only', () => {
    expect(isLegacyReadOnlyConversationType('acp')).toBe(false);
    expect(isLegacyReadOnlyConversationType('aionrs')).toBe(false);

    expect(isLegacyReadOnlyConversationType('codex')).toBe(true);
    expect(isLegacyReadOnlyConversationType('openclaw-gateway')).toBe(true);
    expect(isLegacyReadOnlyConversationType('nanobot')).toBe(true);
    expect(isLegacyReadOnlyConversationType('remote')).toBe(true);
    expect(isLegacyReadOnlyConversationType('gemini')).toBe(true);
  });

  it('does not mark missing type as read-only', () => {
    expect(isLegacyReadOnlyConversationType(undefined)).toBe(false);
    expect(isLegacyReadOnlyConversationType(null)).toBe(false);
  });
});
