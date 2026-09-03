import { requestClient } from '#/api/request';

/** 当前用户有权访问的组织树节点。 */
export interface OrganizationTreeNode {
  children: OrganizationTreeNode[];
  dataAccess: boolean;
  label: string;
  value: string;
}

/** 获取当前登录用户被明确授权的租户、部门和团队树。 */
export async function getOrganizationTreeApi() {
  return requestClient.get<OrganizationTreeNode[]>('/organization-tree');
}
