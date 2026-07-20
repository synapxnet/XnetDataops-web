import type { Role, UserRoleCluster } from './types';

import { requestClient } from '#/api/request';

export function getRoles() {
  return requestClient.get<Role[]>('/roles');
}

export function getRole(id: number) {
  return requestClient.get<Role>(`/roles/${id}`);
}

export function createRole(data: Partial<Role>) {
  return requestClient.post<Role>('/roles', data);
}

export function updateRole(id: number, data: Partial<Role>) {
  return requestClient.put<Role>(`/roles/${id}`, data);
}

export function deleteRole(id: number) {
  return requestClient.delete(`/roles/${id}`);
}

export function getRoleUsers(roleId: number) {
  return requestClient.get<UserRoleCluster[]>(`/roles/${roleId}/users`);
}

export function assignRole(data: Partial<UserRoleCluster>) {
  return requestClient.post<UserRoleCluster>('/user-roles', data);
}

export function removeRoleMapping(id: number) {
  return requestClient.delete(`/user-roles/${id}`);
}
