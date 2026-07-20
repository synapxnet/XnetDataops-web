export interface SqlScript {
  id: number;
  uid: string;
  name: string;
  datasourceId: number;
  content: string;
  scriptType: string;
  folderPath: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueryHistory {
  id: number;
  uid: string;
  datasourceId: number;
  sqlContent: string;
  executeStatus: string;
  rowsAffected: number;
  durationMs: number;
  errorMsg: string;
  executedBy: string;
  executedAt: string;
}

export interface SavedQuery {
  id: number;
  uid: string;
  name: string;
  datasourceId: number;
  sqlContent: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
