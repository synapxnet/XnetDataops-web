export interface MetaTable {
  id: number;
  uid: string;
  datasourceId: number;
  schemaName: string;
  tableName: string;
  tableType: string;
  rowCount: number;
  dataSizeBytes: number;
  description: string;
  owner: string;
  lastSyncAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetaColumn {
  id: number;
  metaTableId: number;
  columnName: string;
  columnType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string;
  description: string;
  sortOrder: number;
}

export interface DataLineage {
  id: number;
  uid: string;
  sourceTableId: number;
  targetTableId: number;
  transformType: string;
  relationshipDesc: string;
  workflowId: number;
  createdAt: string;
}

export interface DataTag {
  id: number;
  name: string;
  tagType: string;
  color: string;
  description: string;
  createdAt: string;
}
