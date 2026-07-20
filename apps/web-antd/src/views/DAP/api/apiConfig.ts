import type { ApiCallLog, ApiConfig, ApiKey } from './types';

import { dapRequestClient } from '#/api/request';

// API配置管理
export function getConfigs() {
  return dapRequestClient.get<ApiConfig[]>('/configs');
}

export function getConfig(id: number) {
  return dapRequestClient.get<ApiConfig>(`/configs/${id}`);
}

export function createConfig(data: Partial<ApiConfig>) {
  return dapRequestClient.post<ApiConfig>('/configs', data);
}

export function updateConfig(id: number, data: Partial<ApiConfig>) {
  return dapRequestClient.put<ApiConfig>(`/configs/${id}`, data);
}

export function deleteConfig(id: number) {
  return dapRequestClient.delete(`/configs/${id}`);
}

export function publishConfig(id: number) {
  return dapRequestClient.post(`/configs/${id}/publish`);
}

export function deprecateConfig(id: number) {
  return dapRequestClient.post(`/configs/${id}/deprecate`);
}

// API密钥管理
export function getKeys() {
  return dapRequestClient.get<ApiKey[]>('/keys');
}

export function createKey(data: Partial<ApiKey>) {
  return dapRequestClient.post<ApiKey>('/keys', data);
}

export function revokeKey(id: number) {
  return dapRequestClient.post(`/keys/${id}/revoke`);
}

export function deleteKey(id: number) {
  return dapRequestClient.delete(`/keys/${id}`);
}

// 调用日志
export function getCallLogs(apiConfigId?: number) {
  return dapRequestClient.get<ApiCallLog[]>('/logs', {
    params: { apiConfigId },
  });
}

export function getCallStats() {
  return dapRequestClient.get('/logs/stats');
}
