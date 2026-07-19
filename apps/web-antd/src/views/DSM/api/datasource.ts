import type { DataSource } from './types';

import { dsmRequestClient } from '#/api/request';

export function getDataSources(type?: string) {
  return dsmRequestClient.get<DataSource[]>('/datasources', { params: { type } });
}

export function getDataSource(id: number) {
  return dsmRequestClient.get<DataSource>(`/datasources/${id}`);
}

export function createDataSource(data: Partial<DataSource>) {
  return dsmRequestClient.post<DataSource>('/datasources', data);
}

export function updateDataSource(id: number, data: Partial<DataSource>) {
  return dsmRequestClient.put<DataSource>(`/datasources/${id}`, data);
}

export function deleteDataSource(id: number) {
  return dsmRequestClient.delete(`/datasources/${id}`);
}

export function testConnection(id: number) {
  return dsmRequestClient.post<{ success: boolean }>(`/datasources/${id}/test`);
}
