import type { MetaTable, MetaColumn, DataTag } from './types';

import { dgvRequestClient } from '#/api/request';

export function getMetaTables(datasourceId?: number) {
  return dgvRequestClient.get<MetaTable[]>('/tables', { params: { datasourceId } });
}

export function getMetaTable(id: number) {
  return dgvRequestClient.get<MetaTable>(`/tables/${id}`);
}

export function createMetaTable(data: Partial<MetaTable>) {
  return dgvRequestClient.post<MetaTable>('/tables', data);
}

export function updateMetaTable(id: number, data: Partial<MetaTable>) {
  return dgvRequestClient.put<MetaTable>(`/tables/${id}`, data);
}

export function deleteMetaTable(id: number) {
  return dgvRequestClient.delete(`/tables/${id}`);
}

export function getColumns(metaTableId: number) {
  return dgvRequestClient.get<MetaColumn[]>(`/tables/${metaTableId}/columns`);
}

export function saveColumns(metaTableId: number, columns: MetaColumn[]) {
  return dgvRequestClient.put(`/tables/${metaTableId}/columns`, columns);
}

export function getTableTags(metaTableId: number) {
  return dgvRequestClient.get<DataTag[]>(`/tables/${metaTableId}/tags`);
}

export function addTableTag(metaTableId: number, tagId: number) {
  return dgvRequestClient.post(`/tables/${metaTableId}/tags/${tagId}`);
}

export function removeTableTag(metaTableId: number, tagId: number) {
  return dgvRequestClient.delete(`/tables/${metaTableId}/tags/${tagId}`);
}
