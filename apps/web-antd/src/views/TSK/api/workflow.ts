import type { Workflow, WorkflowNode, WorkflowEdge } from './types';

import { tskRequestClient } from '#/api/request';

export function getWorkflows() {
  return tskRequestClient.get<Workflow[]>('/workflows');
}

export function getWorkflow(id: number) {
  return tskRequestClient.get<Workflow>(`/workflows/${id}`);
}

export function createWorkflow(data: Partial<Workflow>) {
  return tskRequestClient.post<Workflow>('/workflows', data);
}

export function updateWorkflow(id: number, data: Partial<Workflow>) {
  return tskRequestClient.put<Workflow>(`/workflows/${id}`, data);
}

export function deleteWorkflow(id: number) {
  return tskRequestClient.delete(`/workflows/${id}`);
}

export function updateWorkflowStatus(id: number, status: string) {
  return tskRequestClient.put(`/workflows/${id}/status`, { status });
}

export function getNodes(workflowId: number) {
  return tskRequestClient.get<WorkflowNode[]>(`/workflows/${workflowId}/nodes`);
}

export function getEdges(workflowId: number) {
  return tskRequestClient.get<WorkflowEdge[]>(`/workflows/${workflowId}/edges`);
}

export function saveDAG(workflowId: number, nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  return tskRequestClient.put(`/workflows/${workflowId}/dag`, { nodes, edges });
}

export function triggerWorkflow(id: number, triggerType?: string) {
  return tskRequestClient.post(`/workflows/${id}/trigger`, { triggerType: triggerType || 'manual' });
}
