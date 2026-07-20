import type { TaskInstance, NodeInstance } from './types';

import { tskRequestClient } from '#/api/request';

export function getTaskInstances(workflowId?: number) {
  return tskRequestClient.get<TaskInstance[]>('/instances', { params: { workflowId } });
}

export function getTaskInstance(id: number) {
  return tskRequestClient.get<TaskInstance>(`/instances/${id}`);
}

export function getNodeInstances(taskInstanceId: number) {
  return tskRequestClient.get<NodeInstance[]>(`/instances/${taskInstanceId}/nodes`);
}
