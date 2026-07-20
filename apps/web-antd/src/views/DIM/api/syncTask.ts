import type { SyncTask, FieldMapping, SyncLog } from './types';

import { dimRequestClient } from '#/api/request';

export function getSyncTasks() {
  return dimRequestClient.get<SyncTask[]>('/tasks');
}

export function getSyncTask(id: number) {
  return dimRequestClient.get<SyncTask>(`/tasks/${id}`);
}

export function createSyncTask(data: Partial<SyncTask>) {
  return dimRequestClient.post<SyncTask>('/tasks', data);
}

export function updateSyncTask(id: number, data: Partial<SyncTask>) {
  return dimRequestClient.put<SyncTask>(`/tasks/${id}`, data);
}

export function deleteSyncTask(id: number) {
  return dimRequestClient.delete(`/tasks/${id}`);
}

export function updateTaskStatus(id: number, status: string) {
  return dimRequestClient.put(`/tasks/${id}/status`, { status });
}

export function getFieldMappings(taskId: number) {
  return dimRequestClient.get<FieldMapping[]>(`/tasks/${taskId}/mappings`);
}

export function saveFieldMappings(taskId: number, mappings: FieldMapping[]) {
  return dimRequestClient.put(`/tasks/${taskId}/mappings`, mappings);
}

export function getSyncLogs(taskId: number) {
  return dimRequestClient.get<SyncLog[]>(`/tasks/${taskId}/logs`);
}
