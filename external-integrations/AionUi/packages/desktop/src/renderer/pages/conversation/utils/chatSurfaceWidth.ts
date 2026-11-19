// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

export const CHAT_SURFACE_CONTAINER_CLASS = 'chat-surface-container';

export const STANDALONE_CHAT_SURFACE_WIDTH_CLASS = 'chat-surface-fluid';

export const TEAM_CHAT_SURFACE_WIDTH_CLASS = 'w-full max-w-full';

/** Returns the width class for shared chat rows and send boxes. */
export const getChatSurfaceWidthClass = (isTeamMode: boolean): string =>
  isTeamMode ? TEAM_CHAT_SURFACE_WIDTH_CLASS : STANDALONE_CHAT_SURFACE_WIDTH_CLASS;
