export interface QualityRule {
  id: number;
  uid: string;
  name: string;
  datasourceId: number;
  tableName: string;
  columnName: string;
  ruleType: string;
  ruleExpression: string;
  severity: string;
  enabled: boolean;
  scheduleCron: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityReport {
  id: number;
  uid: string;
  ruleId: number;
  checkTime: string;
  status: string;
  totalRows: number;
  failedRows: number;
  passRate: number;
  detailJson: string;
  createdAt: string;
}

export interface QualityAlert {
  id: number;
  uid: string;
  ruleId: number;
  reportId: number;
  alertLevel: string;
  message: string;
  status: string;
  triggeredAt: string;
  resolvedAt: string;
}
