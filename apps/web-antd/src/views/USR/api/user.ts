import type { User, UserRoleCluster } from './types';

import { requestClient } from '#/api/request';

export function getUsers() {
  return requestClient.get<User[]>('/users');
}

export function getUser(id: number) {
  return requestClient.get<User>(`/users/${id}`);
}

export function createUser(data: Partial<User> & { password?: string }) {
  return requestClient.post<User>('/users', data);
}

export function updateUser(id: number, data: Partial<User>) {
  return requestClient.put<User>(`/users/${id}`, data);
}

export function deleteUser(id: number) {
  return requestClient.delete(`/users/${id}`);
}

export function changePassword(
  id: number,
  oldPassword: string,
  newPassword: string,
) {
  return requestClient.post(`/users/${id}/change-password`, {
    oldPassword,
    newPassword,
  });
}

export function getUserRoles(userId: number) {
  return requestClient.get<UserRoleCluster[]>(`/users/${userId}/roles`);
}
