export interface DataSource {
  id: number;
  uid: string;
  name: string;
  type: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  encryptedPassword?: string;
  connectionParams: string;
  status: string;
  lastTestAt: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
