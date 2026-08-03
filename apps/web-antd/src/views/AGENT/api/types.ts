export interface ToolError {
  code: string;
  details: Record<string, unknown>;
  message: string;
  retryable: boolean;
}

export interface ToolMeta {
  contractVersion: string;
  durationMs: number;
  evidenceId?: string;
  incidentId: string;
  observedAt: string;
  requestId: string;
  resourceVersion?: string;
  source: string;
  toolName: string;
  traceId: string;
  workspaceId: string;
}

export interface AuditReceipt {
  actionId: string;
  actionStatus: string;
  approvalId: string;
  receiptId: string;
  requestDigest: string;
}

export interface ToolResponse<T> {
  auditReceipt: AuditReceipt | null;
  data: T | null;
  error: ToolError | null;
  meta: ToolMeta;
  success: boolean;
}

export interface IncidentContext {
  incidentId: string;
  traceId: string;
  workspaceId: string;
}

export type TraceStepStatus = 'completed' | 'failed' | 'pending' | 'running' | 'waiting_approval';

export interface TraceStep {
  description: string;
  evidenceId?: string;
  id: string;
  status: TraceStepStatus;
  title: string;
  toolName: string;
}
