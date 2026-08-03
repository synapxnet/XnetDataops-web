import {
  agentDgvRequestClient,
  agentDqmRequestClient,
  agentTskRequestClient,
} from '#/api/request';

import type { IncidentContext, ToolResponse } from './types';

export interface QualityReportEvidence {
  assetUid: string;
  checkedAt: string;
  contractCheck?: {
    actualFieldCount: number;
    contractRef: string;
    expectedFieldCount: number;
    status: string;
  };
  failedRows: number;
  passRate: number;
  qualityStatus: string;
  reportUid: string;
  ruleResults: Array<{ failedRows: number; name: string; status: string }>;
  schemaSnapshotUid?: string;
  totalRows: number;
  warnings: string[];
}

export interface SchemaField {
  description?: string;
  name: string;
  nullable: boolean;
  ordinal: number;
  type: string;
}

export interface SchemaSnapshotEvidence {
  assetName: string;
  assetUid: string;
  capturedAt: string;
  fieldCount: number;
  fields: SchemaField[];
  schemaHash: string;
  schemaVersion: string;
  snapshotUid: string;
}

export interface LineageEvidence {
  cycleDetected: boolean;
  edges: Array<{
    edgeUid: string;
    sourceAssetUid: string;
    targetAssetUid: string;
    transformType: string;
    workflowUid?: string;
  }>;
  nodes: Array<{ assetUid: string; name: string; schemaSnapshotUid?: string; type: string }>;
  rootAssetUid: string;
  truncated: boolean;
}

export interface WorkflowInstanceEvidence {
  completedAt?: string;
  instanceUid: string;
  nodes: Array<{
    completedAt?: string;
    durationMs?: number;
    logSummary?: string;
    nodeKey: string;
    startedAt?: string;
    status: string;
  }>;
  startedAt?: string;
  status: string;
  triggerType: string;
  warnings: string[];
  workflowName: string;
  workflowUid: string;
}

/** 创建完整 Trace Header。 */
function headers(context: IncidentContext, toolName: string) {
  return {
    'Idempotency-Key': crypto.randomUUID(),
    'X-OpenXnet-Incident-Id': context.incidentId,
    'X-OpenXnet-Tool-Name': toolName,
    'X-OpenXnet-Trace-Id': context.traceId,
    'X-OpenXnet-Workspace-Id': context.workspaceId,
  };
}

/** 创建只读工具请求包络。 */
function request<T>(toolName: string, argumentsValue: T) {
  return { arguments: argumentsValue, requestId: `req_${crypto.randomUUID()}`, toolName };
}

/** 获取持久化质量报告和契约检查证据。 */
export async function getQualityReportEvidence(reportUid: string, context: IncidentContext) {
  const toolName = 'dataops.quality.report.get';
  return agentDqmRequestClient.post<ToolResponse<QualityReportEvidence>>(
    '/api/agent/v1/tools/dataops.quality.report.get:invoke', request(toolName, { reportUid }),
    { headers: headers(context, toolName) },
  );
}

/** 获取不含样本值的 Schema 快照。 */
export async function getSchemaSnapshotEvidence(assetUid: string, context: IncidentContext) {
  const toolName = 'dataops.schema.snapshot.get';
  return agentDgvRequestClient.post<ToolResponse<SchemaSnapshotEvidence>>(
    '/api/agent/v1/tools/dataops.schema.snapshot.get:invoke', request(toolName, { assetUid }),
    { headers: headers(context, toolName) },
  );
}

/** 获取最大深度受限、稳定排序的资产血缘。 */
export async function getLineageEvidence(assetUid: string, context: IncidentContext) {
  const toolName = 'dataops.lineage.get';
  return agentDgvRequestClient.post<ToolResponse<LineageEvidence>>(
    '/api/agent/v1/tools/dataops.lineage.get:invoke',
    request(toolName, { assetUid, depth: 3, direction: 'BOTH' }),
    { headers: headers(context, toolName) },
  );
}

/** 获取任务实例和按需脱敏日志摘要。 */
export async function getWorkflowInstanceEvidence(
  instanceUid: string,
  includeLogSummary: boolean,
  context: IncidentContext,
) {
  const toolName = 'dataops.workflow.instance.get';
  return agentTskRequestClient.post<ToolResponse<WorkflowInstanceEvidence>>(
    '/api/agent/v1/tools/dataops.workflow.instance.get:invoke',
    request(toolName, { includeLogSummary, instanceUid }),
    { headers: headers(context, toolName) },
  );
}
