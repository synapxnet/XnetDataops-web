import type { MaskingPolicy, MaskingRule, MaskingTaskLog } from './types';

import { dmsRequestClient } from '#/api/request';

// ==================== 脱敏规则 ====================

export function getRules() {
  return dmsRequestClient.get<MaskingRule[]>('/rules');
}

export function getRule(id: number) {
  return dmsRequestClient.get<MaskingRule>(`/rules/${id}`);
}

export function createRule(data: Partial<MaskingRule>) {
  return dmsRequestClient.post<MaskingRule>('/rules', data);
}

export function updateRule(id: number, data: Partial<MaskingRule>) {
  return dmsRequestClient.put<MaskingRule>(`/rules/${id}`, data);
}

export function deleteRule(id: number) {
  return dmsRequestClient.delete(`/rules/${id}`);
}

// ==================== 脱敏策略 ====================

export function getPolicies(datasourceId?: number) {
  return dmsRequestClient.get<MaskingPolicy[]>('/policies', {
    params: { datasourceId },
  });
}

export function getPolicy(id: number) {
  return dmsRequestClient.get<MaskingPolicy>(`/policies/${id}`);
}

export function createPolicy(data: Partial<MaskingPolicy>) {
  return dmsRequestClient.post<MaskingPolicy>('/policies', data);
}

export function updatePolicy(id: number, data: Partial<MaskingPolicy>) {
  return dmsRequestClient.put<MaskingPolicy>(`/policies/${id}`, data);
}

export function deletePolicy(id: number) {
  return dmsRequestClient.delete(`/policies/${id}`);
}

export function togglePolicy(id: number) {
  return dmsRequestClient.post<MaskingPolicy>(`/policies/${id}/toggle`);
}

// ==================== 执行日志 ====================

export function getTaskLogs(policyId?: number) {
  return dmsRequestClient.get<MaskingTaskLog[]>('/task-logs', {
    params: { policyId },
  });
}
