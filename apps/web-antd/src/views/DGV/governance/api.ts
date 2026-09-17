/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：只读治理工作台类型和请求。Purpose: Type and request the read-only governance workbench.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
 */
import { dgvRequestClient } from '#/api/request';

export interface GovernanceAsset {
  uid: string;
  name: string;
  kind: string;
  rowCount: null | number;
}
export interface LineageNode {
  assetUid: string;
  name: string;
  type: string;
  schemaSnapshotUid: null | string;
}
export interface LineageEdge {
  edgeUid: string;
  sourceAssetUid: string;
  targetAssetUid: string;
  transformType: string;
  workflowUid: null | string;
}
export interface Workbench {
  schemaVersion: '1.0.0';
  requestId: string;
  capturedAt: string;
  sourcePlatform: 'dataops';
  sourceOrigin: 'native';
  executionMode: 'fixture' | 'live' | 'replay' | 'simulation';
  availability: 'available' | 'empty' | 'error' | 'unavailable';
  scope: {
    scopeId: string;
    tenantUid: string;
    deptUid: string;
    teamUid: string;
  };
  assets: GovernanceAsset[];
  selectedAssetUid: null | string;
  lineage: null | {
    rootAssetUid: string;
    nodes: LineageNode[];
    edges: LineageEdge[];
    truncated: boolean;
    cycleDetected: boolean;
  };
  schema: null | {
    assetName: string;
    schemaVersion: string;
    schemaHash: string;
    capturedAt: string;
    fields: {
      name: string;
      type: string;
      nullable: boolean;
      ordinal: number;
      description: string;
    }[];
  };
  quality: {
    uid: string;
    assetUid: string;
    ruleName: string;
    status: string;
    checkedAt: string;
    totalRows: null | number;
    failedRows: null | number;
    passRate: null | number;
  }[];
  sources: { source: string; availability: string; summary: string }[];
  capabilities: { readOnly: boolean; execute: boolean };
  limitations: string[];
}

/** 使用网页登录客户端读取证据，绝不附加伪造委托令牌。 Read with browser authentication without synthesizing delegated credentials. */
export function getWorkbench(assetUid?: string, direction = 'both') {
  return dgvRequestClient.get<Workbench>('/governance/workbench', {
    params: { assetUid, direction, maxDepth: 3 },
  });
}
