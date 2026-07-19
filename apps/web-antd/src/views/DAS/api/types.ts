export interface DataAsset {
  id: number;
  uid: string;
  name: string;
  datasourceId: number;
  tableName: string;
  assetType: string;
  category: string;
  domain: string;
  owner: string;
  description: string;
  status: string;
  accessLevel: string;
  rowCount: number;
  dataSizeBytes: number;
  qualityScore: number;
  lastProfiledAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetClassification {
  id: number;
  name: string;
  level: string;
  parentId: number;
  description: string;
  sortOrder: number;
  createdAt: string;
}

export interface AssetAccessRecord {
  id: number;
  uid: string;
  assetId: number;
  userId: number;
  accessType: string;
  accessTime: string;
  ipAddress: string;
  detail: string;
}

export interface AssetStats {
  byDomain: Record<string, number>;
  byCategory: Record<string, number>;
  byAccessLevel: Record<string, number>;
}
