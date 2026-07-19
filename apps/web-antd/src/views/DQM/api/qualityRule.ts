import type { QualityRule } from './types';

import { dqmRequestClient } from '#/api/request';

export function getQualityRules() {
  return dqmRequestClient.get<QualityRule[]>('/rules');
}

export function getQualityRule(id: number) {
  return dqmRequestClient.get<QualityRule>(`/rules/${id}`);
}

export function createQualityRule(data: Partial<QualityRule>) {
  return dqmRequestClient.post<QualityRule>('/rules', data);
}

export function updateQualityRule(id: number, data: Partial<QualityRule>) {
  return dqmRequestClient.put<QualityRule>(`/rules/${id}`, data);
}

export function deleteQualityRule(id: number) {
  return dqmRequestClient.delete(`/rules/${id}`);
}
