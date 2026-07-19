export interface MaskingRule {
  id: number;
  uid: string;
  name: string;
  ruleType: string;
  maskPattern: string;
  replacement: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaskingPolicy {
  id: number;
  uid: string;
  name: string;
  datasourceId: number;
  tableName: string;
  columnName: string;
  ruleId: number;
  enabled: boolean;
  priority: number;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaskingTaskLog {
  id: number;
  uid: string;
  policyId: number;
  status: string;
  totalRows: number;
  maskedRows: number;
  startTime: string;
  endTime: string;
  errorMsg: string;
  createdAt: string;
}
