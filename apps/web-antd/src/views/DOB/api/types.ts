export interface DataMonitor {
  id: number;
  uid: string;
  name: string;
  datasourceId: number;
  tableName: string;
  monitorType: string;
  checkExpression: string;
  thresholdValue: string;
  alertLevel: string;
  enabled: boolean;
  scheduleCron: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonitorEvent {
  id: number;
  uid: string;
  monitorId: number;
  eventType: string;
  eventValue: string;
  expectedValue: string;
  message: string;
  status: string;
  detectedAt: string;
  resolvedAt: string;
}

export interface DataSla {
  id: number;
  uid: string;
  name: string;
  pipelineName: string;
  expectedCompletionTime: string;
  actualCompletionTime: string;
  slaStatus: string;
  date: string;
  createdAt: string;
}
