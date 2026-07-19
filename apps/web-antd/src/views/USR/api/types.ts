export interface User {
  id: number;
  uid: string;
  username: string;
  email: string;
  phone: string;
  userType: string;
  status: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  roleName: string;
  roleCode: string;
  description: string;
  createdAt: string;
}

export interface UserRoleCluster {
  id: number;
  userId: number;
  roleId: number;
  clusterId: number;
  username: string;
  roleName: string;
  roleCode: string;
}
