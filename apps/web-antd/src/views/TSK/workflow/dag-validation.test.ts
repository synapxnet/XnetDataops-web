/* Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：外观、请求和图的回归测试。Purpose: Regression tests for skins, requests and graphs.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com */
import { it, expect } from 'vitest';
import type { WorkflowNode, WorkflowEdge } from '../api/types';
import { validateDAG } from './dag-validation';
/** 构造与真实保存接口同型的测试节点。 Construct nodes with the actual save contract shape. */
function node(nodeKey: string): WorkflowNode {
  return {
    id: 0,
    workflowId: 1,
    nodeKey,
    nodeName: nodeKey,
    nodeType: 'sql',
    configJson: '{}',
    positionX: 0,
    positionY: 0,
  };
}
/** 构造与真实保存接口同型的测试边。 Construct edges with the actual save contract shape. */
function edge(sourceNodeKey: string, targetNodeKey: string): WorkflowEdge {
  return { id: 0, workflowId: 1, sourceNodeKey, targetNodeKey };
}
/** 无环分支可被保存。 A branching acyclic graph can be saved. */
it('accepts branching DAGs', () => {
  expect(
    validateDAG(
      [node('a'), node('b'), node('c')],
      [edge('a', 'b'), edge('a', 'c')],
    ),
  ).toBe('');
});
/** 环及自环必须被拒绝。 Reject cycles and self-loops. */
it('rejects cycles and self-loops', () => {
  expect(
    validateDAG([node('a'), node('b')], [edge('a', 'b'), edge('b', 'a')]),
  ).toContain('循环');
  expect(validateDAG([node('a')], [edge('a', 'a')])).toContain('循环');
});
/** 不允许重复标识和悬空依赖。 Disallow duplicate keys and dangling references. */
it('rejects duplicate nodes and missing endpoints', () => {
  expect(validateDAG([node('a'), node('a')], [])).toContain('重复');
  expect(validateDAG([node('a')], [edge('a', 'z')])).toContain('不存在');
});
/** 错误配置和重复依赖在请求前拒绝。 Reject bad configuration and duplicate dependencies before submitting. */
it('rejects malformed config and duplicate edges', () => {
  expect(validateDAG([{ ...node('a'), configJson: 'null' }], [])).toContain(
    'JSON对象',
  );
  expect(
    validateDAG([node('a'), node('b')], [edge('a', 'b'), edge('a', 'b')]),
  ).toContain('重复');
});
