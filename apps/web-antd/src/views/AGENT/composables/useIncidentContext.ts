import { computed } from 'vue';
import { useRoute } from 'vue-router';

import type { IncidentContext } from '../api/types';

/**
 * 从深链解析 Workspace、Incident 和 Trace，并随路由切换自动更新。
 *
 * @returns 当前事件上下文和完整性状态
 */
export function useIncidentContext() {
  const route = useRoute();

  const context = computed<IncidentContext>(() => ({
    incidentId: String(route.params.incidentId ?? ''),
    traceId: String(route.query.traceId ?? ''),
    workspaceId: String(route.query.workspaceId ?? ''),
  }));

  const isComplete = computed(() =>
    Boolean(context.value.incidentId && context.value.traceId && context.value.workspaceId),
  );

  return { context, isComplete };
}
