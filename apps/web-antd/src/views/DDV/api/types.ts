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

export interface BrowserSource {
  id: number;
  uid: string;
  name: string;
  type: 'MYSQL' | 'POSTGRESQL';
  databaseName: string;
  status: string;
}

export interface BrowserNamespace {
  name: string;
  displayName: string;
  kind: 'database' | 'schema';
  databaseName: string;
}

export interface BrowserTable {
  name: string;
  qualifiedName: string;
  type: string;
  remarks?: string;
}

export interface BrowserColumn {
  name: string;
  jdbcType: number;
  typeName: string;
  nullable: boolean;
  ordinal: number;
  remarks?: string;
}

export interface QueryResultColumn {
  key: string;
  label: string;
  typeName: string;
}

export interface BrowserQueryResult {
  columns: QueryResultColumn[];
  rows: Array<Record<string, unknown>>;
  rowCount: number;
  truncated: boolean;
  durationMs: number;
}

export interface BrowserQueryRequest {
  namespace: string;
  sql: string;
  limit: number;
}
