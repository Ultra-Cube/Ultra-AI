// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║ ██╗   ██╗ ██╗      ███████╗ ██████╗   █████╗                             ║
// ║ ██║   ██║ ██║      ╚══██╔══╝ ██╔══██╗ ██╔══██╗                           ║
// ║ ██║   ██║ ██║         ██║    ██████╔╝ ███████║                           ║
// ║ ╚██╗ ██╔╝ ██║         ██║    ██╔══██║ ██╔══██║                           ║
// ║  ╚████╔╝ ███████╗    ██║    ██║  ██║ ██║  ██║                            ║
// ║   ╚═══╝  ╚══════╝    ╚═╝    ╚═╝  ╚═╝ ╚═╝  ╚═╝                            ║
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
 * Copyright 2026 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export const UPDATE_READY_STATE_EVENT = 'aionui-update-ready-state-changed';

export type UpdateReadyState = {
  ready: boolean;
  version: string;
  filePath?: string;
  preparing?: boolean;
};

let currentUpdateReadyState: UpdateReadyState = {
  ready: false,
  version: '',
};

export const getUpdateReadyState = () => currentUpdateReadyState;

export const setUpdateReadyState = (state: UpdateReadyState) => {
  currentUpdateReadyState = state;
  window.dispatchEvent(new CustomEvent<UpdateReadyState>(UPDATE_READY_STATE_EVENT, { detail: state }));
};

export const subscribeUpdateReadyState = (listener: (state: UpdateReadyState) => void) => {
  const handler = (evt: Event) => {
    listener((evt as CustomEvent<UpdateReadyState>).detail);
  };
  window.addEventListener(UPDATE_READY_STATE_EVENT, handler);
  return () => window.removeEventListener(UPDATE_READY_STATE_EVENT, handler);
};
