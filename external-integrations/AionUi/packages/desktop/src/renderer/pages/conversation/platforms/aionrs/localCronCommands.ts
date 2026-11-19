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

/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

type LocalCronProcessingResult = {
  displayContent?: string;
  systemResponses: string[];
};

const THINK_TAG_RE = /<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi;

function stripThinkTags(text: string): string {
  return text.replace(THINK_TAG_RE, '').trim();
}

/**
 * Strip think tags from the assistant message for display.
 * Cron job creation/update/listing is handled through the injected HTTP helper.
 */
export async function processLocalCronResponse(
  _conversationId: string,
  rawContent: string
): Promise<LocalCronProcessingResult> {
  if (!rawContent.trim()) {
    return { systemResponses: [] };
  }

  const thinkStripped = stripThinkTags(rawContent);
  return {
    displayContent: thinkStripped !== rawContent ? thinkStripped : undefined,
    systemResponses: [],
  };
}
