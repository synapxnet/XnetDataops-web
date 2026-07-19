import type { DataMonitor, DataSla, MonitorEvent } from './types';

import { dobRequestClient } from '#/api/request';

// ==================== 数据监控 ====================

export function getMonitors() {
  return dobRequestClient.get<DataMonitor[]>('/monitors');
}

export function getMonitor(id: number) {
  return dobRequestClient.get<DataMonitor>(`/monitors/${id}`);
}

export function createMonitor(data: Partial<DataMonitor>) {
  return dobRequestClient.post<DataMonitor>('/monitors', data);
}

export function updateMonitor(id: number, data: Partial<DataMonitor>) {
  return dobRequestClient.put<DataMonitor>(`/monitors/${id}`, data);
}

export function deleteMonitor(id: number) {
  return dobRequestClient.delete(`/monitors/${id}`);
}

export function toggleMonitor(id: number) {
  return dobRequestClient.put(`/monitors/${id}/toggle`);
}

// ==================== 监控事件 ====================

export function getEvents(monitorId?: number, status?: string) {
  const params: Record<string, any> = {};
  if (monitorId !== undefined) params.monitorId = monitorId;
  if (status !== undefined) params.status = status;
  return dobRequestClient.get<MonitorEvent[]>('/events', { params });
}

export function acknowledgeEvent(id: number) {
  return dobRequestClient.put(`/events/${id}/acknowledge`);
}

export function resolveEvent(id: number) {
  return dobRequestClient.put(`/events/${id}/resolve`);
}

// ==================== SLA管理 ====================

export function getSlaList() {
  return dobRequestClient.get<DataSla[]>('/slas');
}

export function createSla(data: Partial<DataSla>) {
  return dobRequestClient.post<DataSla>('/slas', data);
}

export function getSlaStats() {
  return dobRequestClient.get<Record<string, any>>('/slas/stats');
}
