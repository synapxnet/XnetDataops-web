import type { DataLineage } from './types';

import { dgvRequestClient } from '#/api/request';

export function getLineageList(tableId?: number) {
  return dgvRequestClient.get<DataLineage[]>('/lineage', { params: { tableId } });
}

export function createLineage(data: Partial<DataLineage>) {
  return dgvRequestClient.post<DataLineage>('/lineage', data);
}

export function deleteLineage(id: number) {
  return dgvRequestClient.delete(`/lineage/${id}`);
}
