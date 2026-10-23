/* Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：外观、请求和图的回归测试。Purpose: Regression tests for skins, requests and graphs.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com */
import { beforeEach, describe, it, expect } from 'vitest';
import {
  beginRequest,
  finishRequest,
  requestIsCurrent,
  pageState,
  clearPageStates,
} from './request-state';
/** 隔离每条测试的组织、代次和草稿。 Isolate scope, generations and drafts between tests. */
beforeEach(() => {
  clearPageStates();
  sessionStorage.setItem('synapxnet:organization-scope', 'team-a');
});
/** 覆盖迟到响应、写失败和组织切换边界。 Cover stale responses, failed writes and scope changes. */
describe('business request ownership', () => {
  /** 同端点的后发读取拥有最终结果。 The later read owns the result for an endpoint. */
  it('rejects an earlier endpoint generation', () => {
    const first = beginRequest('GET', '/rules'),
      second = beginRequest('GET', '/rules');
    expect(requestIsCurrent(first)).toBe(false);
    expect(requestIsCurrent(second)).toBe(true);
  });
  /** 切换组织后旧响应不再有效。 Responses from the prior organization become invalid. */
  it('rejects responses from a prior organization', () => {
    const first = beginRequest('GET', '/rules');
    sessionStorage.setItem('synapxnet:organization-scope', 'team-b');
    expect(requestIsCurrent(first)).toBe(false);
  });
  /** 重载后的相同代次不能接纳旧页面请求。 A reset cannot accept an old request even when sequence numbers match. */
  it('rejects old responses after resetting and reissuing', () => {
    const old = beginRequest('GET', '/rules');
    clearPageStates();
    const current = beginRequest('GET', '/rules');
    finishRequest(old);
    expect(requestIsCurrent(old)).toBe(false);
    expect(pageState().pending).toBe(1);
    expect(requestIsCurrent(current)).toBe(true);
  });
  /** 写失败保留草稿并给出独立错误。 A write failure preserves the draft and exposes a separate error. */
  it('retains the draft after a failed write', () => {
    pageState().dirty = true;
    const write = beginRequest('POST', '/rules');
    finishRequest(write, { response: { status: 409 } });
    expect(pageState().dirty).toBe(true);
    expect(pageState().writeError).toContain('状态已变化');
    expect(Object.keys(pageState().failures)).toHaveLength(0);
  });
  /** 成功读取不会被先前错误永久覆盖。 A successful retry clears the earlier read error. */
  it('clears errors when the same endpoint is retried', () => {
    finishRequest(beginRequest('GET', '/rules'), { response: { status: 503 } });
    expect(Object.keys(pageState().failures)).toHaveLength(1);
    finishRequest(beginRequest('GET', '/rules'));
    expect(Object.keys(pageState().failures)).toHaveLength(0);
  });
  /** 在途写入拒绝重复提交并在结束后允许重试。 Reject duplicate in-flight writes and allow retries after completion. */
  it('prevents duplicate writes and releases the lock', () => {
    const first = beginRequest('POST', '/rules');
    expect(() => beginRequest('POST', '/rules')).toThrow();
    finishRequest(first, { response: { status: 503 } });
    expect(() => beginRequest('POST', '/rules')).not.toThrow();
  });
});
