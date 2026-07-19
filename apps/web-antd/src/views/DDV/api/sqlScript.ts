import type { SqlScript, QueryHistory, SavedQuery } from './types';

import { ddvRequestClient } from '#/api/request';

export function getScripts() {
  return ddvRequestClient.get<SqlScript[]>('/scripts');
}

export function getScript(id: number) {
  return ddvRequestClient.get<SqlScript>(`/scripts/${id}`);
}

export function createScript(data: Partial<SqlScript>) {
  return ddvRequestClient.post<SqlScript>('/scripts', data);
}

export function updateScript(id: number, data: Partial<SqlScript>) {
  return ddvRequestClient.put<SqlScript>(`/scripts/${id}`, data);
}

export function deleteScript(id: number) {
  return ddvRequestClient.delete(`/scripts/${id}`);
}

export function getQueryHistory(datasourceId?: number) {
  return ddvRequestClient.get<QueryHistory[]>('/history', { params: { datasourceId } });
}

export function recordQueryHistory(data: Partial<QueryHistory>) {
  return ddvRequestClient.post<QueryHistory>('/history', data);
}

export function getSavedQueries() {
  return ddvRequestClient.get<SavedQuery[]>('/saved');
}

export function createSavedQuery(data: Partial<SavedQuery>) {
  return ddvRequestClient.post<SavedQuery>('/saved', data);
}

export function updateSavedQuery(id: number, data: Partial<SavedQuery>) {
  return ddvRequestClient.put<SavedQuery>(`/saved/${id}`, data);
}

export function deleteSavedQuery(id: number) {
  return ddvRequestClient.delete(`/saved/${id}`);
}
