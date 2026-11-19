// [UCUBETECH-COPYRIGHT]
// Ultra AI — Copyright (c) Ultra Cube Tech — ucubetech.com
// Developed by Ultra Zone Team — ultra-zone.ucubetech.com
// GitHub: github.com/Ultra-Cube · Proprietary — all rights reserved

import { useMemo } from 'react';
import { useConversationHistoryContext } from '@/renderer/hooks/context/ConversationHistoryContext';
import { useLayoutContext } from '@/renderer/hooks/context/LayoutContext';
import { buildVisibleConversationIds } from '../utils/visibleConversationOrder';
import { useWorkspaceExpansionState } from './useWorkspaceExpansionState';

export const useVisibleConversationIds = (): string[] => {
  const layout = useLayoutContext();
  const siderCollapsed = layout?.siderCollapsed ?? false;
  const { groupedHistory } = useConversationHistoryContext();
  const expandedWorkspaces = useWorkspaceExpansionState();

  return useMemo(() => {
    return buildVisibleConversationIds({
      ...groupedHistory,
      expandedWorkspaces,
      siderCollapsed,
    });
  }, [groupedHistory, expandedWorkspaces, siderCollapsed]);
};
