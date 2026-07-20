export interface SyncTask {
  id: number;
  uid: string;
  name: string;
  sourceDsId: number;
  targetDsId: number;
  sourceTable: string;
  targetTable: string;
  syncMode: string;
  incrementalField: string;
  scheduleCron: string;
  status: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FieldMapping {
  id: number;
  taskId: number;
  sourceField: string;
  targetField: string;
  transformExpression: string;
  sortOrder: number;
}

export interface SyncLog {
  id: number;
  uid: string;
  taskId: number;
  startTime: string;
  endTime: string;
  status: string;
  rowsRead: number;
  rowsWritten: number;
  errorMsg: string;
  createdAt: string;
}
