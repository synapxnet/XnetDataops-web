import type { QualityReport, QualityAlert } from './types';

import { dqmRequestClient } from '#/api/request';

export function getQualityReports(ruleId?: number) {
  return dqmRequestClient.get<QualityReport[]>('/reports', { params: { ruleId } });
}

export function getQualityAlerts(status?: string) {
  return dqmRequestClient.get<QualityAlert[]>('/alerts', { params: { status } });
}

export function resolveAlert(id: number) {
  return dqmRequestClient.put(`/alerts/${id}/resolve`);
}

export function acknowledgeAlert(id: number) {
  return dqmRequestClient.put(`/alerts/${id}/acknowledge`);
}
