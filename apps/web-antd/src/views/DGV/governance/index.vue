<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：原生数据治理工作台。Purpose: Present scoped native data governance evidence.
Author: maoyo | Department: 研发部 | Date: 2026-09-13
Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
-->
<script setup lang="ts">
import FeatureDriftEntry from '#/components/feature-drift/FeatureDriftEntry.vue';
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue';
import {
  Alert,
  Button,
  Empty,
  Input,
  Segmented,
  Spin,
  Tag,
} from 'ant-design-vue';
import { getWorkbench, type Workbench } from './api';
import {
  percentage,
  validateWorkbench,
  workbenchErrorMessage,
  type OrganizationScope,
} from './presentation';
import { layoutLineage } from './lineage-layout';
import { DatabaseOutlined } from '@ant-design/icons-vue';

const snapshot = ref<null | Workbench>(null);
const loading = ref(false);
const error = ref('');
const query = ref('');
const view = ref('lineage');
const direction = ref('both');
const organization = inject<Ref<OrganizationScope> | null>(
  'selectedOrganization',
  null,
);
let generation = 0;
let scopeKey = '';
let scopeTimer: ReturnType<typeof setInterval> | undefined;
const viewOptions = [
  { label: '血缘影响', value: 'lineage' },
  { label: '质量证据', value: 'quality' },
  { label: 'Schema 版本', value: 'schema' },
];
const directionOptions = [
  { label: '上下游', value: 'both' },
  { label: '上游来源', value: 'upstream' },
  { label: '下游影响', value: 'downstream' },
];
// 视图派生仅使用当前响应，不产生样例记录。 Derive view state only from the current response without fixtures.
const assets = computed(
  () =>
    snapshot.value?.assets.filter((asset) =>
      asset.name.toLowerCase().includes(query.value.toLowerCase()),
    ) ?? [],
);
const selected = computed(() =>
  snapshot.value?.assets.find(
    (asset) => asset.uid === snapshot.value?.selectedAssetUid,
  ),
);
const graph = computed(() =>
  layoutLineage(
    snapshot.value?.lineage?.nodes ?? [],
    snapshot.value?.lineage?.edges ?? [],
    snapshot.value?.selectedAssetUid ?? '',
  ),
);
const modeLabel = computed(() =>
  snapshot.value
    ? {
        live: '真实来源',
        simulation: '内部仿真',
        replay: '历史回放',
        fixture: '测试资料',
      }[snapshot.value.executionMode]
    : '',
);

/** 读取当前网页组织范围作为请求代次标识，不将其当授权证明。 Read the browser scope key for stale-response protection, never as proof of authorization. */
function currentScope() {
  try {
    return sessionStorage.getItem('synapxnet:organization-scope') ?? '';
  } catch {
    return '';
  }
}

/** 重新读取资料，丢弃切换组织后到达的旧响应。 Refresh evidence and discard responses that belong to an earlier organization. */
async function load(assetUid?: string) {
  const requestGeneration = ++generation;
  const requestedScope = currentScope();
  scopeKey = requestedScope;
  snapshot.value = null;
  loading.value = true;
  error.value = '';
  try {
    const result = await getWorkbench(assetUid, direction.value);
    if (requestGeneration === generation && requestedScope === currentScope())
      snapshot.value = validateWorkbench(result, requestedScope);
  } catch (reason) {
    if (requestGeneration === generation && requestedScope === currentScope())
      error.value = workbenchErrorMessage(reason);
  } finally {
    if (requestGeneration === generation) loading.value = false;
  }
}

/** 将源节点坐标生成实际关系线。 Generate the path for an existing source edge using its endpoint coordinates. */
function edgePath(sourceUid: string, targetUid: string) {
  const source = graph.value.nodes.find((node) => node.assetUid === sourceUid);
  const target = graph.value.nodes.find((node) => node.assetUid === targetUid);
  if (!source || !target) return '';
  const start = source.x + 204;
  const end = target.x;
  const bend = Math.max(start + 36, (start + end) / 2);
  return `M ${start} ${source.y + 37} C ${bend} ${source.y + 37}, ${end - 36} ${target.y + 37}, ${end} ${target.y + 37}`;
}

/** 仅格式化实际数值，不把缺失转换为零。 Format real numeric values and preserve unknown measurements. */
function number(value: null | number | undefined) {
  return value == null ? '未提供' : value.toLocaleString('zh-CN');
}
/** 格式化源时间，缺少时区时不强行转换。 Format source time without inventing a timezone for legacy timestamps. */
function time(value?: string) {
  return value ? value.replace('T', ' ').replace('Z', ' UTC') : '未提供';
}
/** 将已知源状态译成中文，未知值保留明确未知说明。 Translate known source statuses and label unrecognized values as unknown. */
function qualityStatus(value: string) {
  const labels: Record<string, string> = {
    passed: '通过',
    pass: '通过',
    success: '通过',
    failed: '未通过',
    fail: '未通过',
    error: '检查失败',
    pending: '等待检查',
    running: '检查中',
  };
  return labels[value?.toLowerCase()] ?? '未知状态';
}
/** 方向变化只触发只读重取证。 Refresh read-only evidence when the browsing direction changes. */
function changeDirection() {
  void load(snapshot.value?.selectedAssetUid ?? undefined);
}

// 宿主组织一变化就清旧资料，再于存储同步后读取。 Clear immediately on host scope changes and read after its session storage update.
if (organization)
  watch(
    organization,
    () => {
      generation++;
      snapshot.value = null;
      error.value = '';
      query.value = '';
      loading.value = false;
      // 当前事件结束后组织请求头已同步。 The host has synchronized request headers after the current event.
      queueMicrotask(() => {
        void load();
      });
    },
    { deep: true, flush: 'sync' },
  );
// 独立挂载时使用轻量范围检查作为兼容后备。 Use scope polling only when mounted without the host organization provider.
onMounted(() => {
  void load();
  if (!organization)
    scopeTimer = setInterval(() => {
      if (currentScope() !== scopeKey) {
        query.value = '';
        void load();
      }
    }, 500);
});
// 页面离开后取消状态回填。 Stop polling and invalidate pending responses on unmount.
onBeforeUnmount(() => {
  generation++;
  if (scopeTimer) clearInterval(scopeTimer);
});
</script>

<template>
  <main class="data-governance" data-governance-workbench>
    <FeatureDriftEntry label="跨域恢复 · 回填质量与血缘" />
    <header class="governance-header">
      <div>
        <h1>数据治理工作台</h1>
      </div>
      <div class="header-actions">
        <Tag v-if="snapshot" color="blue">{{ modeLabel }}</Tag
        ><Button :loading="loading" @click="load()">刷新资料</Button>
      </div>
    </header>
    <Alert
      v-if="error"
      :message="error"
      type="warning"
      show-icon
      class="governance-alert"
    />
    <section class="governance-layout">
      <aside class="asset-panel">
        <div class="panel-title">
          <strong>授权数据资产</strong
          ><span>{{ snapshot?.assets.length ?? '—' }}</span>
        </div>
        <Input
          v-model:value="query"
          placeholder="搜索当前资产"
          allow-clear
          aria-label="搜索当前资产"
        />
        <Spin :spinning="loading"
          ><div class="asset-list">
            <button
              v-for="asset in assets"
              :key="asset.uid"
              type="button"
              :class="[
                'asset-row',
                { selected: snapshot?.selectedAssetUid === asset.uid },
              ]"
              :aria-pressed="snapshot?.selectedAssetUid === asset.uid"
              @click="load(asset.uid)"
            >
              <span class="asset-icon"><DatabaseOutlined /></span
              ><span
                ><strong>{{ asset.name }}</strong
                ><small
                  >{{ asset.kind || '数据表' }} ·
                  {{ number(asset.rowCount) }} 行</small
                ></span
              >
            </button>
            <Empty
              v-if="!loading && !assets.length"
              :description="
                error
                  ? '当前资料不可用'
                  : query
                    ? '没有匹配的资产'
                    : '当前范围暂无授权资产'
              "
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
            /></div
        ></Spin>
        <div class="scope-caption">仅展示服务端明确授权的资源</div>
      </aside>
      <section class="evidence-panel">
        <header class="selection-header">
          <div>
            <span class="eyebrow">当前分析对象</span>
            <h2>
              {{
                selected?.name || (loading ? '正在读取资料…' : '选择数据资产')
              }}
            </h2>
            <p v-if="snapshot">采集于 {{ time(snapshot.capturedAt) }}</p>
          </div>
          <Segmented v-model:value="view" :options="viewOptions" />
        </header>
        <Spin :spinning="loading">
          <div v-if="view === 'lineage'" class="lineage-view">
            <div class="view-toolbar">
              <Segmented
                v-model:value="direction"
                :options="directionOptions"
                @change="changeDirection"
              /><span>表级已登记关系</span>
            </div>
            <div v-if="snapshot?.lineage" class="lineage-canvas">
              <svg
                :width="graph.width"
                :height="graph.height"
                role="img"
                aria-label="数据资产血缘关系图"
              >
                <defs>
                  <marker
                    id="data-governance-arrow"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                  </marker>
                </defs>
                <path
                  v-for="edge in graph.edges"
                  :key="edge.edgeUid"
                  :d="edgePath(edge.sourceAssetUid, edge.targetAssetUid)"
                  class="lineage-edge"
                  marker-end="url(#data-governance-arrow)"
                >
                  <title>{{ edge.transformType }} · {{ edge.edgeUid }}</title>
                </path>
                <g
                  v-for="node in graph.nodes"
                  :key="node.assetUid"
                  :transform="`translate(${node.x},${node.y})`"
                  :class="[
                    'lineage-node',
                    { root: node.assetUid === snapshot?.selectedAssetUid },
                  ]"
                  tabindex="0"
                  role="button"
                  :aria-label="`查看${node.name}`"
                  @click="load(node.assetUid)"
                  @keydown.enter="load(node.assetUid)"
                  @keydown.space.prevent="load(node.assetUid)"
                >
                  <rect width="204" height="74" rx="12" />
                  <text x="16" y="27">
                    {{
                      node.name.length > 22
                        ? `${node.name.slice(0, 21)}…`
                        : node.name
                    }}
                  </text>
                  <text x="16" y="51" class="node-description">
                    {{ node.type }} ·
                    {{ node.schemaSnapshotUid ? '已有快照' : '未登记快照' }}
                  </text>
                  <title>{{ node.name }}</title>
                </g>
              </svg>
            </div>
            <Empty v-else-if="!loading" description="尚未取得血缘关系" />
            <div class="graph-notes">
              <Tag v-if="snapshot?.lineage?.cycleDetected" color="orange"
                >存在有向循环</Tag
              ><Tag v-if="snapshot?.lineage?.truncated" color="orange"
                >已达到当前浏览范围</Tag
              ><span v-if="snapshot?.lineage && !graph.edges.length"
                >当前资产没有已登记的可见关系</span
              >
            </div>
            <details v-if="graph.edges.length" class="edge-details">
              <summary>查看 {{ graph.edges.length }} 条来源关系</summary>
              <ul>
                <li v-for="edge in graph.edges" :key="edge.edgeUid">
                  {{ edge.sourceAssetUid }} → {{ edge.targetAssetUid }} ·
                  {{ edge.transformType }}
                </li>
              </ul>
            </details>
          </div>
          <div v-else-if="view === 'quality'" class="quality-view">
            <article
              v-for="report in snapshot?.quality"
              :key="report.uid"
              class="quality-report"
            >
              <header>
                <div>
                  <h3>{{ report.ruleName || '质量检查' }}</h3>
                  <p>{{ time(report.checkedAt) }}</p>
                </div>
                <Tag :title="report.status">{{
                  qualityStatus(report.status)
                }}</Tag>
              </header>
              <dl>
                <div>
                  <dt>检查记录</dt>
                  <dd>{{ number(report.totalRows) }}</dd>
                </div>
                <div>
                  <dt>失败记录</dt>
                  <dd>{{ number(report.failedRows) }}</dd>
                </div>
                <div>
                  <dt>通过率</dt>
                  <dd>{{ percentage(report.passRate) }}</dd>
                </div>
              </dl>
              <small>{{ report.uid }}</small>
            </article>
            <Empty
              v-if="!loading && !snapshot?.quality.length"
              description="尚无可见且关联当前资产的质量记录"
            />
          </div>
          <div v-else class="schema-view">
            <template v-if="snapshot?.schema"
              ><div class="schema-heading">
                <h3>Schema {{ snapshot.schema.schemaVersion }}</h3>
                <span>{{ time(snapshot.schema.capturedAt) }}</span>
              </div>
              <div class="schema-table">
                <table>
                  <thead>
                    <tr>
                      <th>字段</th>
                      <th>类型</th>
                      <th>可空</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="field in snapshot.schema.fields"
                      :key="field.name"
                    >
                      <td>{{ field.name }}</td>
                      <td>{{ field.type }}</td>
                      <td>{{ field.nullable ? '是' : '否' }}</td>
                      <td>{{ field.description || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <details class="edge-details">
                <summary>版本摘要</summary>
                <code>{{ snapshot.schema.schemaHash }}</code>
              </details></template
            >
            <Empty
              v-else-if="!loading"
              description="尚未登记可见的 Schema 版本"
            />
          </div>
        </Spin>
        <footer v-if="snapshot" class="source-footer">
          <div>
            <span
              v-for="source in snapshot.sources"
              :key="source.source"
              :class="{ unavailable: source.availability === 'unavailable' }"
              >{{ source.summary }} ·
              {{
                {
                  available: '已取得',
                  empty: '暂无记录',
                  unavailable: '不可用',
                  error: '错误',
                }[source.availability] || source.availability
              }}</span
            >
          </div>
          <details>
            <summary>资料范围说明</summary>
            <ul>
              <li v-for="item in snapshot.limitations" :key="item">
                {{ item }}
              </li>
            </ul>
          </details>
        </footer>
      </section>
    </section>
  </main>
</template>

<style scoped>
.data-governance {
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  min-height: calc(100vh - 130px);
  padding: calc(var(--dataops-space) * 0.75) var(--dataops-space);
}
.governance-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  min-height: 40px;
  margin-bottom: 14px;
}
.eyebrow {
  font-size: 12px;
  color: hsl(var(--primary));
  font-weight: 650;
}
.governance-header h1 {
  font-size: 19px;
  font-weight: 650;
  letter-spacing: -0.3px;
  margin: 0;
}
.governance-header p,
.selection-header p {
  color: hsl(var(--muted-foreground));
  margin: 6px 0;
  font-size: 12px;
}
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.governance-alert {
  margin-bottom: 16px;
}
.governance-layout {
  border: 1px solid hsl(var(--border));
  border-radius: var(--dataops-radius);
  display: grid;
  grid-template-columns: 258px minmax(0, 1fr);
  overflow: hidden;
  background: hsl(var(--card));
}
.asset-panel {
  border-right: 1px solid hsl(var(--border));
  padding: 20px 14px;
  background: hsl(var(--muted) / 0.25);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel-title {
  display: flex;
  justify-content: space-between;
  padding: 0 5px;
  font-size: 12px;
}
.panel-title span {
  color: hsl(var(--muted-foreground));
}
.asset-list {
  min-height: 360px;
  max-height: 560px;
  overflow: auto;
}
.asset-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  text-align: left;
  padding: 12px 8px;
  cursor: pointer;
  margin: 3px 0;
}
.asset-row:hover {
  background: hsl(var(--accent));
}
.asset-row.selected {
  background: hsl(var(--primary) / 0.08);
  border-color: hsl(var(--primary) / 0.25);
}
.asset-icon {
  color: hsl(var(--primary));
  font-size: 20px;
}
.asset-row > span:last-child {
  min-width: 0;
}
.asset-row strong {
  font-size: 13px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.asset-row small {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  display: block;
  margin-top: 5px;
}
.scope-caption {
  font-size: 12px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
  margin-top: auto;
}
.evidence-panel {
  min-width: 0;
}
.selection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid hsl(var(--border));
}
.selection-header h2 {
  font-size: 18px;
  margin: 6px 0;
  overflow-wrap: anywhere;
}
.view-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  gap: 12px;
}
.view-toolbar > span {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
.lineage-canvas {
  overflow: auto;
  max-height: 530px;
  background-image: radial-gradient(hsl(var(--border)) 1px, transparent 1px);
  background-size: 20px 20px;
}
.lineage-edge {
  fill: none;
  stroke: hsl(var(--primary) / 0.5);
  stroke-width: 1.5;
  color: hsl(var(--primary));
}
.lineage-node {
  cursor: pointer;
  outline: none;
}
.lineage-node rect {
  fill: hsl(var(--card));
  stroke: hsl(var(--border));
  stroke-width: 1.3;
}
.lineage-node.root rect,
.lineage-node:focus rect {
  fill: hsl(var(--primary) / 0.08);
  stroke: hsl(var(--primary));
}
.lineage-node text {
  fill: hsl(var(--foreground));
  font-size: 12px;
  font-weight: 550;
}
.lineage-node .node-description {
  fill: hsl(var(--muted-foreground));
  font-size: 10px;
  font-weight: 400;
}
.graph-notes {
  padding: 8px 24px;
  color: hsl(var(--muted-foreground));
  font-size: 11px;
  min-height: 32px;
}
.edge-details {
  margin: 14px 24px;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  overflow-wrap: anywhere;
}
.edge-details summary {
  cursor: pointer;
  padding: 8px 0;
}
.edge-details li {
  padding: 5px 0;
}
.quality-view,
.schema-view {
  padding: 24px;
  min-height: 370px;
  max-height: 590px;
  overflow: auto;
}
.quality-report {
  border-bottom: 1px solid hsl(var(--border));
  padding: 16px 0;
}
.quality-report:first-child {
  padding-top: 0;
}
.quality-report header,
.schema-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.quality-report header {
  align-items: flex-start;
}
.quality-report h3,
.schema-heading h3 {
  font-size: 14px;
  margin: 0;
}
.quality-report p,
.schema-heading span,
.quality-report small {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}
.quality-report dl {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 18px 0;
}
.quality-report dt {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}
.quality-report dd {
  font-size: 20px;
  margin: 6px 0;
}
.schema-table {
  overflow: auto;
  margin: 20px 0;
}
.schema-table table {
  width: 100%;
  font-size: 12px;
  text-align: left;
  border-collapse: collapse;
}
.schema-table th {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  font-weight: 500;
}
.schema-table td,
.schema-table th {
  padding: 12px;
  border-bottom: 1px solid hsl(var(--border));
  white-space: nowrap;
}
.source-footer {
  border-top: 1px solid hsl(var(--border));
  padding: 16px 24px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
.source-footer > div {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.source-footer .unavailable {
  color: #b7791f;
}
.source-footer details {
  margin-top: 12px;
}
.source-footer summary {
  cursor: pointer;
}
.source-footer li {
  margin-top: 6px;
}
.asset-row:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: -2px;
}
@media (max-width: 1100px) {
  .data-governance {
    padding: 16px;
  }
  .governance-layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }
  .selection-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (max-width: 768px) {
  .governance-header {
    align-items: flex-start;
    gap: 12px;
  }
  .governance-header h1 {
    font-size: 18px;
  }
  .governance-layout {
    grid-template-columns: 1fr;
  }
  .asset-panel {
    border-right: 0;
    border-bottom: 1px solid hsl(var(--border));
  }
  .asset-list {
    min-height: 60px;
    max-height: 180px;
  }
  .scope-caption {
    display: none;
  }
  .selection-header,
  .quality-view,
  .schema-view {
    padding: 18px;
  }
  .view-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .header-actions {
    flex-direction: column;
    align-items: flex-end;
  }
  .quality-report dd {
    font-size: 16px;
  }
}
</style>
