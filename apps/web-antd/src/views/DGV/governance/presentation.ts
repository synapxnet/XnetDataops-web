/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：校验工作台响应与显示单位。Purpose: Validate workbench scope and explicit display units.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
 */
import type { Workbench } from './api';

export interface OrganizationScope {
  tenantUid: null | string;
  deptUid: null | string;
  teamUid: null | string;
}

/** 仅接受当前组织和平台的明确版本响应，缺少来源模式则拒绝。 Accept only the current organization, platform and schema with an explicit source mode. */
export function validateWorkbench(
  value: Workbench,
  requestedScope: string,
): Workbench {
  const expected = JSON.parse(requestedScope) as OrganizationScope;
  if (
    !expected?.tenantUid ||
    !expected.deptUid ||
    !expected.teamUid ||
    value?.schemaVersion !== '1.0.0' ||
    value.sourcePlatform !== 'dataops' ||
    value.sourceOrigin !== 'native' ||
    !['live', 'simulation', 'replay', 'fixture'].includes(
      value.executionMode,
    ) ||
    value.scope?.tenantUid !== expected.tenantUid ||
    value.scope.deptUid !== expected.deptUid ||
    value.scope.teamUid !== expected.teamUid ||
    !value.scope.scopeId ||
    !['available', 'empty', 'unavailable', 'error'].includes(
      value.availability,
    ) ||
    !Array.isArray(value.assets) ||
    !Array.isArray(value.quality) ||
    !Array.isArray(value.sources)
  ) {
    throw new Error('WORKBENCH_CONTRACT_MISMATCH');
  }
  return value;
}

/** 按领域百分数原值格式化，通过率0.5表示0.5%，不猜测比例。 Format the stored percent value directly; 0.5 means 0.5 percent. */
export function percentage(value: null | number): string {
  return value == null || !Number.isFinite(value)
    ? '未提供'
    : value.toFixed(2) + '%';
}

/** 将HTTP状态和后端公开说明转成可读错误，不显示传输层技术消息。 Explain HTTP status or a public backend message without exposing transport diagnostics. */
export function workbenchErrorMessage(reason: unknown): string {
  const failure = reason as {
    response?: { status?: number; data?: { code?: number; message?: string } };
  } | null;
  const status = failure?.response?.status ?? failure?.response?.data?.code;
  const messages: Record<number, string> = {
    401: '登录已失效，请重新登录后查看资料',
    403: '当前组织范围无权查看这些资料',
    404: '指定资产已不存在，请重新选择',
    503: '资料来源尚未连接或暂不可用，请稍后重试',
  };
  const publicMessage = failure?.response?.data?.message;
  return (
    (status && messages[status]) ||
    (typeof publicMessage === 'string' && publicMessage.length <= 300
      ? publicMessage
      : '') ||
    '暂时无法读取治理资料，请刷新后重试'
  );
}
