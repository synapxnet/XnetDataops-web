/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 证据来源、隔离和缺失测量边界测试 / Source, isolation and missing-measurement tests.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-18 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  comparisonMeasurements,
  conclusion,
  measurements,
  metric,
  parseRun,
  parseRuns,
  percent,
} from './model.ts';

/** 建立无测量的隔离记录。 Create an isolated record without measurements. */
function run(overrides = {}) {
  return {
    sourceMode: 'REAL_CPU_SYNTHETIC_STAGING',
    synthetic: true,
    incidentId: 'event-a',
    workspaceId: 'space-a',
    actions: [],
    ...overrides,
  };
}

/** 拒绝模拟或不完整来源。 Reject simulated or incomplete provenance. */
test('legacy simulation cannot appear as real execution evidence', () => {
  for (const overrides of [
    { sourceMode: 'LIVE-STAGING' },
    { sourceMode: null },
    { synthetic: false },
    { incidentId: '' },
    { workspaceId: '' },
  ])
    assert.throws(() => parseRun(run(overrides)));
  assert.throws(() => parseRuns({}));
  assert.deepEqual(parseRuns({ items: [] }), []);
});
/** 确保不同事件与工作空间的回包无法覆盖当前详情。 Reject responses for another event or workspace. */
test('detail matching rejects cross-event and cross-workspace responses', () => {
  assert.throws(() => parseRun(run(), 'event-b', 'space-a'));
  assert.throws(() => parseRun(run(), 'event-a', 'space-b'));
  assert.equal(parseRun(run(), 'event-a', 'space-a').incidentId, 'event-a');
});
/** 缺失和非数值指标不被包装成正常值。 Missing and invalid metrics never become healthy values. */
test('missing measurements stay missing and real zero remains visible', () => {
  for (const value of [null, undefined, NaN, Infinity, '0']) {
    assert.equal(metric(value), '未采集');
    assert.equal(percent(value), '未采集');
  }
  assert.equal(metric(0), '0');
  assert.equal(percent(0), '0.00%');
  assert.equal(percent(-1), '未采集');
  assert.equal(percent(1.1), '未采集');
});
/** 晋级、成功回执或补偿不能替代独立验证。 Promotion, receipts and compensation cannot replace independent verification. */
test('execution success is not reported as business recovery', () => {
  const unmeasured = parseRun(
    run({
      phase: 'PROMOTED',
      actions: [{ action: 'promote', status: 'SUCCEEDED' }],
    }),
  );
  assert.equal(measurements(unmeasured).length, 0);
  assert.match(conclusion(unmeasured), /等待独立采样/);
  assert.match(
    conclusion(parseRun(run({ latestProbe: { businessRecovered: true } }))),
    /独立采样达到恢复阈值/,
  );
  assert.match(
    conclusion(
      parseRun(
        run({
          latestProbe: { businessRecovered: true },
          compensation: { status: 'SUCCEEDED' },
        }),
      ),
    ),
    /补偿.*原修复目标未达成/,
  );
});
/** 历史采样保留原始阶段，不用最新回包覆盖基线。 Preserve recorded stages instead of replacing baseline with the latest sample. */
test('baseline measurements survive later successful probes', () => {
  const recorded = [
    { stage: 'baseline', errorRate: 1 },
    { stage: 'active', errorRate: 0 },
  ];
  assert.deepEqual(
    measurements(
      parseRun(run({ measurements: recorded, latestProbe: { errorRate: 0 } })),
    ),
    recorded,
  );
});

/** 对比视图保留固定基线，即使滚动历史已淘汰它。 Keep the frozen baseline after the rolling history has evicted it. */
test('comparison keeps the frozen fault baseline and latest stage readings', () => {
  const baseline = { measurementId: 'b', stage: 'baseline', errorRate: 1 };
  const active = { measurementId: 'a2', stage: 'active', errorRate: 0 };
  const state = parseRun(
    run({
      baselineProbe: baseline,
      measurements: [
        { measurementId: 'a1', stage: 'active', errorRate: 1 },
        active,
      ],
    }),
  );
  assert.deepEqual(comparisonMeasurements(state), [baseline, active]);
  assert.equal(measurements(state).length, 3);
});
