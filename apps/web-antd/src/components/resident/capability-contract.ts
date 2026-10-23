/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 驻场能力契约 / Resident capability contracts.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-19 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import type { ResidentHealth } from './resident-api';

export type Platform = 'aiops' | 'dataops' | 'mlops';
export interface KnowledgeEntry {
  id: string;
  title: string;
  namespace: string;
  summary: string;
  body?: string;
  content?: string;
  truncated?: boolean;
  sourceRefs: string[];
  relatedToolNames: string[];
  relatedSkillIds: string[];
  version?: string;
  status?: string;
  freshness?: string;
  reviewAfter?: string | null;
  contentDigest?: string;
}
export interface ResidentSkill {
  id: string;
  name: string;
  version: string;
  description: string;
  status: string;
  permissionMode: string;
  riskLevel: string;
  approvalRequired: boolean;
  allowedToolNames: string[];
  knowledgeIds: string[];
  inputFields: string[];
  outputFields: string[];
  inputSchema?: unknown;
  outputSchema?: unknown;
  sourceRefs?: string[];
  steps: string[];
  stopConditions: string[];
  verificationRules: string[];
  failurePolicy: string;
  executable: boolean;
  unavailableReasons: string[];
  certification: {
    status: string;
    environment: string | null;
    artifactRefs: string[];
  };
}
export interface CapabilityTool {
  name: string;
  title: string;
  description?: string;
  riskLevel: string;
  available?: boolean;
  unavailableReason?: string;
  inputSchema?: unknown;
}
export interface KnowledgeCatalog {
  platform: Platform;
  status: string;
  packVersion: string;
  packDigest?: string;
  indexMode?: string;
  entries: KnowledgeEntry[];
  limitations?: string[];
  errorCode?: string;
}
export interface SkillCatalog {
  platform: Platform;
  status: string;
  packVersion: string;
  entries: ResidentSkill[];
}
export interface Capabilities {
  platform: Platform;
  tools: CapabilityTool[];
}
export interface KnowledgeQuery {
  platform?: Platform;
  query: string;
  results: KnowledgeEntry[];
}
export interface WorkbenchHealth extends ResidentHealth {
  workspaceIds?: string[];
  observedAt?: string;
  allowedTools?: CapabilityTool[];
  handoffStatus?: string;
}
export const platformTitles: Record<Platform, string> = {
  aiops: '运行保障员工',
  dataops: '数据治理员工',
  mlops: '模型工程员工',
};
export const platformNames: Record<Platform, string> = {
  aiops: 'XnetAIOps',
  dataops: 'XnetDataOps',
  mlops: 'XnetMLOps',
};
export const platformDescriptions: Record<Platform, string> = {
  aiops: '熟悉服务、告警与运行资源，以当前证据判断运行风险。',
  dataops: '熟悉数据质量、特征血缘与发布规则，追踪问题从哪里产生。',
  mlops: '熟悉输入契约、训练评估与模型版本，判断模型为何退化。',
};
const statuses: Record<string, string> = {
  domain: '领域知识',
  runbook: '处置手册',
  verification: '验证规范',
  environment: '环境与边界',
  capability: '能力说明',
  ONLINE: '服务有响应',
  READY: '可读取',
  AVAILABLE: '可读取',
  UNAVAILABLE: '未接入',
  DEGRADED: '需检查',
  candidate: '待认证',
  CANDIDATE: '待认证',
  REFERENCE_ONLY: '参考目录',
  PENDING_CERTIFICATION: '待认证',
  pending: '待认证',
  PENDING_INTEGRATION: '协同待接线',
  stale: '已过期',
  STALE: '已过期',
  published: '已发布',
  CURRENT: '在有效期内',
  UNKNOWN: '有效性未确认',
  INACTIVE: '未生效',
  CERTIFICATION_REQUIRED: '尚无认证工件',
  PLATFORM_TOOLS_UNAVAILABLE: '工具未配置或未授权',
  read: '只读',
  'guarded-write': '受控写入',
};
/** 翻译契约状态，未知值不映射为成功。 / Label known states without converting unknown states to success. */
export function stateLabel(value?: string): string {
  return value ? (statuses[value] ?? value) : '未确认';
}
/** 安全格式化服务端时间，不生成虚构时间。 / Format server time without inventing a timestamp. */
export function timeLabel(value?: string | null): string {
  if (!value) return '未提供';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '时间无效'
    : date.toLocaleString('zh-CN', { hour12: false });
}
