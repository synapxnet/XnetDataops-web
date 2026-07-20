import type { AuditLog, DataChangeRecord, ComplianceReport } from './types';

import { dauRequestClient } from '#/api/request';

// 审计日志
export function getAuditLogs(module?: string, action?: string, userId?: number) {
  return dauRequestClient.get<AuditLog[]>('/audit-logs', {
    params: { module, action, userId },
  });
}

export function createAuditLog(data: Partial<AuditLog>) {
  return dauRequestClient.post<AuditLog>('/audit-logs', data);
}

export function getAuditStats() {
  return dauRequestClient.get('/audit-logs/stats');
}

// 数据变更记录
export function getDataChanges(datasourceId?: number, tableName?: string) {
  return dauRequestClient.get<DataChangeRecord[]>('/data-changes', {
    params: { datasourceId, tableName },
  });
}

export function createDataChange(data: Partial<DataChangeRecord>) {
  return dauRequestClient.post<DataChangeRecord>('/data-changes', data);
}

// 合规报告
export function getComplianceReports() {
  return dauRequestClient.get<ComplianceReport[]>('/compliance-reports');
}

export function createComplianceReport(data: Partial<ComplianceReport>) {
  return dauRequestClient.post<ComplianceReport>('/compliance-reports', data);
}

export function getComplianceReport(id: number) {
  return dauRequestClient.get<ComplianceReport>(`/compliance-reports/${id}`);
}

export function reviewReport(id: number) {
  return dauRequestClient.put(`/compliance-reports/${id}/review`);
}

export function archiveReport(id: number) {
  return dauRequestClient.put(`/compliance-reports/${id}/archive`);
}
