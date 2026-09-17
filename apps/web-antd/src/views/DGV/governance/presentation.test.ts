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
import { describe, expect, it } from 'vitest';
import type { Workbench } from './api';
import {
  percentage,
  validateWorkbench,
  workbenchErrorMessage,
} from './presentation';

/** 构造仅用于契约断言的最小空响应。 Build a minimal empty response for contract assertions only. */
function response(): Workbench {
  return {
    schemaVersion: '1.0.0',
    requestId: 'test',
    capturedAt: '',
    sourcePlatform: 'dataops',
    sourceOrigin: 'native',
    executionMode: 'fixture',
    availability: 'empty',
    scope: { scopeId: 's', tenantUid: 't', deptUid: 'd', teamUid: 'team' },
    assets: [],
    selectedAssetUid: null,
    lineage: null,
    schema: null,
    quality: [],
    sources: [],
    capabilities: { readOnly: true, execute: false },
    limitations: [],
  };
}
const scope = JSON.stringify({ tenantUid: 't', deptUid: 'd', teamUid: 'team' });

/** 验证百分数、身份与公开错误的展示边界。 Verify display boundaries for percent units, scope identity and public errors. */
describe('workbench presentation contracts', () => {
  /** 小于一的百分数也必须保持原单位。 Preserve percent units even for values below one. */
  it.each([
    [0, '0.00%'],
    [0.5, '0.50%'],
    [1, '1.00%'],
    [99.8, '99.80%'],
    [null, '未提供'],
  ] as const)('formats percent %s', (value, expected) => {
    expect(percentage(value)).toBe(expected);
  });
  /** 匹配的完整响应可展示。 Accept a complete response for the current scope. */
  it('accepts a matching scope', () => {
    expect(validateWorkbench(response(), scope).availability).toBe('empty');
  });
  /** 错平台、模式或组织响应不可回填。 Reject responses from another platform, mode or organization. */
  it.each([
    { schemaVersion: '2' },
    { sourcePlatform: 'mlops' },
    { executionMode: undefined },
    {
      scope: { scopeId: 's', tenantUid: 't', deptUid: 'd', teamUid: 'foreign' },
    },
  ])('rejects incompatible response %s', (change) => {
    expect(() =>
      validateWorkbench({ ...response(), ...change } as Workbench, scope),
    ).toThrow();
  });
  /** HTTP状态采用友好说明，不显示Axios错误细节。 Explain native HTTP errors without leaking Axios diagnostic text. */
  it.each([401, 403, 503])('explains HTTP %s', (status) => {
    const message = workbenchErrorMessage({
      response: { status, data: { code: status, message: 'public' } },
      message: 'Axios transport detail',
    });
    expect(message).not.toContain('Axios');
    expect(message).not.toBe('public');
  });
  /** 未知错误只显示通用提示。 Unknown errors use a readable generic message. */
  it('hides unknown transport errors', () => {
    expect(
      workbenchErrorMessage(new Error('private host address')),
    ).not.toContain('private');
  });
});
