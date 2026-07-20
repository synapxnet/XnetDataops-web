import type { DataTag } from './types';

import { dgvRequestClient } from '#/api/request';

export function getTags() {
  return dgvRequestClient.get<DataTag[]>('/tags');
}

export function createTag(data: Partial<DataTag>) {
  return dgvRequestClient.post<DataTag>('/tags', data);
}

export function updateTag(id: number, data: Partial<DataTag>) {
  return dgvRequestClient.put<DataTag>(`/tags/${id}`, data);
}

export function deleteTag(id: number) {
  return dgvRequestClient.delete(`/tags/${id}`);
}
