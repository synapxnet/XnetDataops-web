/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 驻场服务客户端。 Resident service client.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-15 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
export interface ResidentScope {
  tenantUid: string | null;
  deptUid: string | null;
  teamUid: string | null;
  dataAccess?: boolean;
}
export interface ResidentModel {
  baseUrl: string;
  model: string;
  provider?: string;
  apiKeyConfigured: boolean;
  configured: boolean;
  source?: string;
  updatedAt?: string | null;
}
export interface ResidentHealth {
  agentId: string;
  platform: string;
  agentVersion: string;
  status: string;
  model: ResidentModel;
  modelConfigured?: boolean;
  toolsConfigured?: boolean;
  handoffAvailable?: boolean;
  user?: { userId: string; canConfigure: boolean; canUseTools: boolean };
  source?: string;
}
export interface ResidentEvent {
  id?: string;
  taskId?: string | null;
  type: string;
  timestamp?: string;
  occurredAt?: string;
  message?: string;
  data?: unknown;
}
export interface ResidentTask {
  id: string;
  conversationId?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  events?: ResidentEvent[];
  errorCode?: string | null;
}
export interface ResidentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  taskId: string;
  createdAt: string;
}
export interface ResidentEscalation {
  id: string;
  status: string;
  runId: string | null;
  reason: string;
}
export interface ResidentConversation {
  id: string;
  title: string;
  workspaceId: string;
  updatedAt: string;
  source: string;
  messages: ResidentMessage[];
  events: ResidentEvent[];
  tasks: ResidentTask[];
  escalations: ResidentEscalation[];
}
export interface ResidentModelInput {
  baseUrl: string;
  model: string;
  apiKey?: string;
  provider?: string;
}
export interface ResidentClientContext {
  token: string;
  scope: ResidentScope;
  userId?: string | number;
}
const ACTIVE_STATUSES = new Set(['QUEUED', 'RUNNING']);

/** 判断服务端任务是否仍在运行。 Determine whether a server task is active. */
export function isActiveTask(task: ResidentTask | null): boolean {
  return Boolean(task && ACTIVE_STATUSES.has(task.status.toUpperCase()));
}

/** 仅展示安全字段，防止工具意外回显秘密。 Render safe fields without accidental tool secret disclosure. */
export function safeDetails(value: unknown): string {
  return JSON.stringify(value, redactDetail, 2)?.slice(0, 32_000) ?? '';
}

/** 对敏感字段递归去敏。 Redact sensitive fields recursively. */
function redactDetail(key: string, value: unknown): unknown {
  return /api.?key|authorization|password|secret|token|credential/i.test(key)
    ? '[REDACTED]'
    : value;
}

/** 按当前登录身份和组织范围调用同源驻场服务。 Call the same-origin resident service with the current identity and scope. */
export async function residentRequest<T>(
  context: ResidentClientContext,
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  if (!context.token) throw new Error('请先登录');
  const headers = new Headers({
    Accept: 'application/json',
    Authorization: `Bearer ${context.token}`,
  });
  // 有组织选择时附加上下文；Attach context only when an organization is selected.
  if (context.scope.tenantUid) headers.set('X-Tenant-Uid', context.scope.tenantUid);
  if (context.scope.deptUid) headers.set('X-Dept-Uid', context.scope.deptUid);
  if (context.scope.teamUid) headers.set('X-Team-Uid', context.scope.teamUid);
  if (context.userId) headers.set('X-User-Id', String(context.userId));
  if (options.body !== undefined)
    headers.set('Content-Type', 'application/json');
  const deadline = AbortSignal.timeout(30_000);
  const response = await fetch(`/api/resident/v1${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
    signal: options.signal
      ? AbortSignal.any([options.signal, deadline])
      : deadline,
  });
  let envelope: any;
  try {
    envelope = await response.json();
  } catch {
    throw new Error('驻场服务未返回有效响应');
  }
  if (
    !response.ok ||
    envelope.ok === false ||
    (typeof envelope.code === 'number' && envelope.code !== 0 &&
      (envelope.code < 200 || envelope.code >= 300))
  ) {
    const code = envelope.error?.code ?? envelope.code;
    if (response.status === 401) throw new Error('登录已失效，请重新登录');
    if (response.status === 403) throw new Error('当前账号没有此操作权限');
    throw new Error(
      typeof envelope.error?.message === 'string'
        ? envelope.error.message
        : typeof envelope.message === 'string'
          ? envelope.message
          : `驻场服务请求失败 (${response.status}${code ? ` / ${code}` : ''})`,
    );
  }
  return (envelope.data ?? envelope) as T;
}
