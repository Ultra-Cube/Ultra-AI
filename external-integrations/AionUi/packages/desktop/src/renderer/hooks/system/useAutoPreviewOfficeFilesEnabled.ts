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

import type { IResponseMessage } from '@/common/adapter/ipcBridge';
import { useConfig } from '@/renderer/hooks/config/useConfig';

const OFFICE_AUTO_PREVIEW_TRIGGER_TYPES = new Set(['tool_group', 'tool_call', 'acp_tool_call']);

export const isOfficeAutoPreviewTriggerMessage = (message: Pick<IResponseMessage, 'type'>): boolean =>
  OFFICE_AUTO_PREVIEW_TRIGGER_TYPES.has(message.type);

export const findNewOfficeFiles = (currentFiles: string[], knownFiles: Set<string>): string[] =>
  currentFiles.filter((file_path) => !knownFiles.has(file_path));

/**
 * Returns whether auto-preview for newly created Office files is enabled globally.
 */
export const useAutoPreviewOfficeFilesEnabled = (): boolean => {
  const [enabled] = useConfig('system.autoPreviewOfficeFiles');
  return enabled ?? true;
};
