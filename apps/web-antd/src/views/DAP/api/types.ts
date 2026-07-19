export interface ApiConfig {
  id: number;
  uid: string;
  name: string;
  path: string;
  method: string;
  datasourceId: number;
  sqlContent: string;
  paramConfig: string;
  description: string;
  status: string;
  rateLimit: number;
  cacheTtl: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: number;
  uid: string;
  appName: string;
  apiKey: string;
  secretKey: string;
  status: string;
  permissions: string;
  expireAt: string;
  createdBy: string;
  createdAt: string;
}

export interface ApiCallLog {
  id: number;
  apiConfigId: number;
  apiKeyId: number;
  requestParams: string;
  responseStatus: number;
  responseTime: number;
  ipAddress: string;
  calledAt: string;
}
