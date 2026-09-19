/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 真实执行证据读取与显示约束 / Real execution evidence validation and presentation.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-18 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
export type EvidenceObject = Record<string, unknown>;
export type Platform = 'aiops' | 'dataops' | 'mlops';
export interface DriftRun extends EvidenceObject {
  sourceMode: 'REAL_CPU_SYNTHETIC_STAGING';
  synthetic: true;
  incidentId: string;
  workspaceId: string;
  traceId?: string;
  createdAt?: string;
  updatedAt?: string;
  phase?: string;
  dataset: EvidenceObject | null;
  training: EvidenceObject | null;
  deployment: EvidenceObject | null;
  latestProbe: EvidenceObject | null;
  compensation: EvidenceObject | null;
  actions: EvidenceObject[];
}

/** 仅接收普通JSON对象。 Accept plain JSON objects only. */
export function object(value: unknown): EvidenceObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as EvidenceObject)
    : {};
}
/** 提取有界对象列表，不制造缺失记录。 Extract bounded object lists without inventing missing records. */
export function records(value: unknown): EvidenceObject[] {
  return Array.isArray(value) ? value.slice(0, 1000).filter(isObject) : [];
}
/** 检查一个值是否为对象。 Check whether a value is a record. */
function isObject(value: unknown): value is EvidenceObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
/** 验证真实来源和事件身份，绝不将旧模拟记录转换成真实结果。 Validate real source and event identity without converting old simulated records. */
export function parseRun(
  value: unknown,
  expectedIncident?: string,
  expectedWorkspace?: string,
): DriftRun {
  const row = object(value);
  if (row.sourceMode !== 'REAL_CPU_SYNTHETIC_STAGING' || row.synthetic !== true)
    throw new Error('此记录未提供真实执行来源，不能作为本次恢复证据');
  if (
    typeof row.incidentId !== 'string' ||
    !row.incidentId ||
    typeof row.workspaceId !== 'string' ||
    !row.workspaceId
  )
    throw new Error('执行记录缺少事件或工作空间标识');
  if (expectedIncident && row.incidentId !== expectedIncident)
    throw new Error('返回的事件与当前选择不一致，请重新读取');
  if (expectedWorkspace && row.workspaceId !== expectedWorkspace)
    throw new Error('返回的工作空间与当前选择不一致，请重新读取');
  return {
    ...row,
    dataset: isObject(row.dataset) ? row.dataset : null,
    training: isObject(row.training) ? row.training : null,
    deployment: isObject(row.deployment) ? row.deployment : null,
    latestProbe: isObject(row.latestProbe) ? row.latestProbe : null,
    compensation: isObject(row.compensation) ? row.compensation : null,
    actions: records(row.actions),
  } as DriftRun;
}
/** 验证列表包络；缺少列表不是正常空列表。 Validate the list envelope; a missing list is not an empty result. */
export function parseRuns(value: unknown): DriftRun[] {
  const source = object(value);
  if (!Array.isArray(source.items))
    throw new Error('执行记录列表格式不完整，请重试');
  return source.items.map(parseListItem);
}
/** 独立解析每一项。 Parse each item independently. */
function parseListItem(value: unknown): DriftRun {
  return parseRun(value);
}
/** 展示标量，缺失保持未记录。 Present scalar values without turning absence into success. */
export function field(value: unknown): string {
  return typeof value === 'string' && value
    ? value
    : typeof value === 'number' && Number.isFinite(value)
      ? String(value)
      : '未记录';
}
/** 格式化真实来源时间。 Format actual source timestamps. */
export function time(value: unknown): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleString('zh-CN', { hour12: false })
    : '未记录';
}
/** 格式化真实数值，缺失不显示零。 Format real measurements without replacing missing values by zero. */
export function metric(value: unknown, unit = '', digits = 2): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '未采集';
  return `${value.toLocaleString('zh-CN', { maximumFractionDigits: digits })}${unit}`;
}
/** 展示范围有效的比例。 Present ratios only when they are in range. */
export function percent(value: unknown): string {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
    ? `${(value * 100).toFixed(2)}%`
    : '未采集';
}
/** 提供明确状态文字，未知状态保留原文。 Provide explicit state text while preserving unknown values. */
export function status(value: unknown): string {
  const labels: Record<string, string> = {
    INITIALIZED: '基线已建立',
    BASELINE: '故障基线',
    FALLBACK: '备用特征已启用',
    BACKFILLED: '数据回填完成',
    FEATURE_PUBLISHED: '特征已发布',
    TRAINED: '训练已完成',
    EVALUATED: '评估已完成',
    REGISTERED: '模型已登记',
    CANARY: '灰度中',
    PROMOTED: '候选模型已激活',
    RECOVERED: '恢复采样已达标',
    ROLLED_BACK: '已回滚',
    COMPENSATED: '补偿已执行',
    FAILED: '执行失败',
    RUNNING: '执行中',
    SUCCEEDED: '执行完成',
    COMPLETED: '执行完成',
    INTERRUPTED: '执行中断',
    PENDING: '等待执行',
    FAULT_OBSERVED: '故障基线已采集',
    CONTRACT_MISMATCH: '输入契约不匹配',
    MITIGATED: '备用特征已缓解',
    DATA_REPAIRED: '数据回填完成',
    MODEL_TRAINED: '实际训练已完成',
    CANARY_PASSED: '灰度采样通过',
    RELEASED_AWAITING_VERIFICATION: '执行已发布',
    PASSED: '检查通过',
    'fallback-remove': '退出备用特征',
    initialize: '建立独立故障基线',
    fallback: '启用备用特征',
    backfill: '重算与回填特征',
    'feature-publish': '发布特征转换',
    train: 'CPU 实际训练',
    evaluate: '独立模型评估',
    register: '登记真实模型产物',
    canary: '按比例灰度推理',
    promote: '激活候选模型',
    rollback: '回滚模型与特征',
  };
  return typeof value === 'string'
    ? (labels[value] ?? labels[value.toUpperCase()] ?? value)
    : '未记录';
}
/** 保留完整摘要，短文本仅用于列表。 Preserve complete hashes and shorten only list captions. */
export function short(value: unknown): string {
  const text = field(value);
  return text.length > 22 ? `${text.slice(0, 12)}…${text.slice(-7)}` : text;
}
/** 只展示真实保存的采样快照，不从执行状态推导指标。 Show persisted measurement snapshots without deriving metrics from execution state. */
export function measurements(run: DriftRun | null): EvidenceObject[] {
  if (!run) return [];
  const saved = records(run.measurements);
  if (saved.length) {
    const retained = [run.baselineProbe, run.candidateProbe].filter(isObject);
    const missing = retained.filter(
      (sample) =>
        !saved.some((entry) => entry.measurementId === sample.measurementId),
    );
    return [...missing, ...saved];
  }
  return run.latestProbe ? [{ ...run.latestProbe, stage: 'latest' }] : [];
}

/** 首屏保留故障基线和每阶段最近测量，完整历史仍可展开。 Keep the fault baseline and latest reading per stage while retaining expandable history. */
export function comparisonMeasurements(run: DriftRun | null): EvidenceObject[] {
  const all = measurements(run);
  const grouped = new Map<string, EvidenceObject>();
  for (const sample of all) {
    const stage = typeof sample.stage === 'string' ? sample.stage : 'latest';
    if (stage !== 'baseline' || !grouped.has(stage)) grouped.set(stage, sample);
  }
  if (isObject(run?.baselineProbe)) grouped.set('baseline', run.baselineProbe);
  const order = [
    'baseline',
    'mitigated',
    'candidate',
    'canary',
    'active',
    'compensated',
    'latest',
  ];
  return [...grouped.entries()]
    .sort((left, right) => order.indexOf(left[0]) - order.indexOf(right[0]))
    .map((entry) => entry[1]);
}
/** 根据实际布尔结论描述采样，补偿不会被称为业务恢复。 Describe sampled results without calling compensation business recovery. */
export function conclusion(run: DriftRun): string {
  if (run.compensation)
    return '补偿记录已产生；原修复目标未达成';
  if (run.latestProbe?.businessRecovered === true)
    return '独立采样达到恢复阈值';
  if (run.latestProbe?.businessRecovered === false)
    return '独立采样尚未达到恢复条件';
  return '等待独立采样确认恢复结果';
}
