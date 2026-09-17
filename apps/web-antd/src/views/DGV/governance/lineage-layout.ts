/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：将真实有界关系布局成可读图。Purpose: Lay out actual bounded lineage without inventing relationships.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
 */
import type { LineageEdge, LineageNode } from './api';

/** 按真实方向分列，循环仅影响坐标而不改变边。 Group nodes by actual direction while retaining cycles and original edges. */
export function layoutLineage(
  nodes: LineageNode[],
  edges: LineageEdge[],
  root: string,
) {
  const unique = [
    ...new Map(
      nodes.slice(0, 100).map((node) => [node.assetUid, node]),
    ).values(),
  ];
  const ids = new Set(unique.map((node) => node.assetUid));
  const safeEdges = edges
    .slice(0, 200)
    .filter(
      (edge) => ids.has(edge.sourceAssetUid) && ids.has(edge.targetAssetUid),
    );
  const layers = new Map<string, number>([[root, 0]]);
  const queue = [root];
  // 每个节点只扩展一次，环图也有界。 Expand each node once so cyclic graphs remain bounded.
  while (queue.length) {
    const current = queue.shift()!;
    const depth = layers.get(current) ?? 0;
    for (const edge of safeEdges) {
      const next =
        edge.sourceAssetUid === current
          ? edge.targetAssetUid
          : edge.targetAssetUid === current
            ? edge.sourceAssetUid
            : null;
      if (next && !layers.has(next)) {
        layers.set(next, depth + (edge.sourceAssetUid === current ? 1 : -1));
        queue.push(next);
      }
    }
  }
  const minimum = Math.min(0, ...layers.values());
  const rows = new Map<number, number>();
  const positioned = unique.map((node) => {
    // 同层节点按输入稳定排列，保留原始UID。 Place nodes stably within their column while retaining source identity.
    const layer = layers.get(node.assetUid) ?? 0;
    const row = rows.get(layer) ?? 0;
    rows.set(layer, row + 1);
    return { ...node, x: 32 + (layer - minimum) * 250, y: 36 + row * 114 };
  });
  return {
    nodes: positioned,
    edges: safeEdges,
    width: Math.max(740, ...positioned.map((node) => node.x + 240)),
    height: Math.max(350, ...positioned.map((node) => node.y + 110)),
  };
}
