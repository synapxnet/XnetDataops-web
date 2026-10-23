/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：验证真实关系图的边界。Purpose: Test lineage graph identity and bounds.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
 */
import { describe, expect, it } from 'vitest';
import { layoutLineage } from './lineage-layout';

// 独立验证孤立点、循环和不可见端点，不对布局坐标逐行镜像。 Verify isolated nodes, cycles and hidden endpoints independently of layout coordinates.
describe('native lineage projection', () => {
  // 空数据必须保持空。 Empty data must stay empty.
  it('does not invent assets or edges', () => {
    expect(layoutLineage([], [], '').nodes).toEqual([]);
  });
  // 循环可以布局，未知端点关系必须排除。 Cycles must terminate and edges with missing endpoints must be excluded.
  it('preserves actual cycles and excludes missing endpoints', () => {
    const nodes = ['a', 'b'].map((assetUid) => ({
      assetUid,
      name: assetUid,
      type: 'table',
      schemaSnapshotUid: null,
    }));
    const edges = [
      ['a', 'b'],
      ['b', 'a'],
      ['a', 'foreign'],
    ].map(([sourceAssetUid, targetAssetUid], index) => ({
      edgeUid: `${index}`,
      sourceAssetUid: sourceAssetUid!,
      targetAssetUid: targetAssetUid!,
      transformType: 'etl',
      workflowUid: null,
    }));
    const graph = layoutLineage(nodes, edges, 'a');
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges.map((edge) => edge.edgeUid)).toEqual(['0', '1']);
    expect(
      graph.nodes.every(
        (node) => Number.isFinite(node.x) && Number.isFinite(node.y),
      ),
    ).toBe(true);
  });
});
