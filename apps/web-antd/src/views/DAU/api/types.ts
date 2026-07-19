export interface AuditLog {
  id: number;
  uid: string;
  userId: number;
  username: string;
  module: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  detail: string;
  ipAddress: string;
  operateAt: string;
}

export interface DataChangeRecord {
  id: number;
  uid: string;
  datasourceId: number;
  tableName: string;
  changeType: string;
  affectedRows: number;
  changeSql: string;
  changedBy: string;
  changedAt: string;
}

export interface ComplianceReport {
  id: number;
  uid: string;
  name: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  totalEvents: number;
  riskEvents: number;
  status: string;
  generatedBy: string;
  createdAt: string;
}
