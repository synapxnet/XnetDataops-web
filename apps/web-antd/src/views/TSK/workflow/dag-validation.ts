/* Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：工作流图验证。Purpose: Validate workflow graphs.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com */
import type { WorkflowNode, WorkflowEdge } from '../api/types';
/** 保存前检查节点、配置JSON、引用、重复连线和有向环。 Validate nodes, JSON configuration, references, duplicate edges and cycles before save. */
export function validateDAG(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): string {
  const keys = new Set<string>();
  for (const node of nodes) {
    if (
      !/^[\w-]{1,64}$/.test(node.nodeKey) ||
      !node.nodeName.trim() ||
      !node.nodeType.trim()
    )
      return '节点需要有效标识、名称和类型';
    if (keys.has(node.nodeKey)) return '节点标识不能重复';
    keys.add(node.nodeKey);
    try {
      const config = JSON.parse(node.configJson || '{}');
      if (!config || typeof config !== 'object' || Array.isArray(config))
        return '节点配置必须是JSON对象';
    } catch {
      return '节点配置不是有效JSON';
    }
  }
  const seen = new Set<string>(),
    links = new Map<string, string[]>();
  for (const edge of edges) {
    if (!keys.has(edge.sourceNodeKey) || !keys.has(edge.targetNodeKey))
      return '连线引用了不存在的节点';
    const pair = edge.sourceNodeKey + '|' + edge.targetNodeKey;
    if (seen.has(pair)) return '节点间存在重复连线';
    seen.add(pair);
    links.set(edge.sourceNodeKey, [
      ...(links.get(edge.sourceNodeKey) ?? []),
      edge.targetNodeKey,
    ]);
  }
  const visiting = new Set<string>(),
    visited = new Set<string>();
  /** 深度优先检测依赖环。 Detect dependency cycles with depth-first traversal. */
  function cyclic(key: string): boolean {
    if (visiting.has(key)) return true;
    if (visited.has(key)) return false;
    visiting.add(key);
    for (const next of links.get(key) ?? []) if (cyclic(next)) return true;
    visiting.delete(key);
    visited.add(key);
    return false;
  }
  return nodes.some((node) => cyclic(node.nodeKey))
    ? '工作流存在循环依赖，请调整连线'
    : '';
}
