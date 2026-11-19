// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import React from 'react';

export type SettingsViewMode = 'modal' | 'page';

const SettingsViewModeContext = React.createContext<SettingsViewMode>('modal');

export const SettingsViewModeProvider = SettingsViewModeContext.Provider;

export const useSettingsViewMode = (): SettingsViewMode => {
  return React.useContext(SettingsViewModeContext);
};

/**
 * Navigate to a builtin settings tab from within tab content.
 * Each host injects its own implementation: the modal switches its internal
 * active tab, the page navigates via the router. Undefined when no host provides it.
 */
export type SettingsTabNavigate = (tabId: string) => void;

const SettingsTabNavigateContext = React.createContext<SettingsTabNavigate | undefined>(undefined);

export const SettingsTabNavigateProvider = SettingsTabNavigateContext.Provider;

export const useSettingsTabNavigate = (): SettingsTabNavigate | undefined => {
  return React.useContext(SettingsTabNavigateContext);
};
