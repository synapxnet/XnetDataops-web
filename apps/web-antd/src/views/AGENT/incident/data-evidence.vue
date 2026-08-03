<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Alert, Button, Empty, Table, Tag } from 'ant-design-vue';

import {
  getLineageEvidence,
  getQualityReportEvidence,
  getSchemaSnapshotEvidence,
  getWorkflowInstanceEvidence,
} from '../api/dataopsTool';
import type {
  LineageEvidence,
  QualityReportEvidence,
  SchemaSnapshotEvidence,
  WorkflowInstanceEvidence,
} from '../api/dataopsTool';
import type { ToolMeta } from '../api/types';
import IncidentContextBar from '../components/IncidentContextBar.vue';
import { useIncidentContext } from '../composables/useIncidentContext';

const route = useRoute();
const { context, isComplete } = useIncidentContext();
const selected = ref('quality');
const loading = ref(false);
const errorMessage = ref('');
const quality = ref<QualityReportEvidence>();
const schema = ref<SchemaSnapshotEvidence>();
const lineage = ref<LineageEvidence>();
const workflow = ref<WorkflowInstanceEvidence>();
const meta = ref<Record<string, ToolMeta>>({});

const assetUid = computed(() => String(route.query.assetUid ?? 'asset_risk_features_prod'));
const reportUid = computed(() => String(route.query.reportUid ?? 'qr_risk_features_120'));
const instanceUid = computed(() => String(route.query.instanceUid ?? 'task_risk_features_latest'));

const navigation = computed(() => [
  { id: 'quality', label: '质量报告', ready: Boolean(quality.value) },
  { id: 'schema', label: 'Schema 快照', ready: Boolean(schema.value) },
  { id: 'lineage', label: '资产血缘', ready: Boolean(lineage.value) },
  { id: 'workflow', label: '任务实例', ready: Boolean(workflow.value) },
]);

const schemaColumns = [
  { dataIndex: 'ordinal', key: 'ordinal', title: '#', width: 64 },
  { dataIndex: 'name', key: 'name', title: '字段' },
  { dataIndex: 'type', key: 'type', title: '标准类型', width: 140 },
  { dataIndex: 'nullable', key: 'nullable', title: '可空', width: 88 },
  { dataIndex: 'description', key: 'description', title: '说明' },
];

const nodeColumns = [
  { dataIndex: 'nodeKey', key: 'nodeKey', title: '节点' },
  { dataIndex: 'status', key: 'status', title: '状态', width: 100 },
  { dataIndex: 'durationMs', key: 'durationMs', title: '耗时(ms)', width: 110 },
  { dataIndex: 'logSummary', key: 'logSummary', title: '脱敏日志摘要' },
];

/** 并行加载四段 DataOps 证据，任一失败不覆盖其他成功结果。 */
async function loadEvidence() {
  if (!isComplete.value) return;
  loading.value = true;
  errorMessage.value = '';
  const results = await Promise.allSettled([
    getQualityReportEvidence(reportUid.value, context.value),
    getSchemaSnapshotEvidence(assetUid.value, context.value),
    getLineageEvidence(assetUid.value, context.value),
    getWorkflowInstanceEvidence(instanceUid.value, false, context.value),
  ]);
  assign('quality', results[0], quality);
  assign('schema', results[1], schema);
  assign('lineage', results[2], lineage);
  assign('workflow', results[3], workflow);
  const failures = results.filter((item) => item.status === 'rejected').length;
  if (failures) errorMessage.value = `${failures} 项数据证据暂不可用。`;
  loading.value = false;
}

/** 将成功 ToolResponse 写入对应状态。 */
function assign<T>(
  key: string,
  result: PromiseSettledResult<{ data: null | T; meta: ToolMeta; success: boolean }>,
  target: { value?: T },
) {
  if (result.status === 'fulfilled' && result.value.success && result.value.data) {
    target.value = result.value.data;
    meta.value[key] = result.value.meta;
  }
}

/** 显式按需加载节点日志，默认请求完全不读取 log_content。 */
async function loadLogSummary() {
  const response = await getWorkflowInstanceEvidence(instanceUid.value, true, context.value);
  if (response.success && response.data) {
    workflow.value = response.data;
    meta.value.workflow = response.meta;
  }
}

/** 将比例格式化为百分数。 */
function percent(value?: number) {
  return value === undefined ? '-' : `${(value * 100).toFixed(2)}%`;
}

onMounted(loadEvidence);
</script>

<template>
  <div class="agent-page">
    <IncidentContextBar :context="context" :loading="loading" severity="P1" status="取证中" @refresh="loadEvidence" />
    <Alert v-if="!isComplete" banner message="深链缺少 workspaceId 或 traceId。" type="warning" />
    <Alert v-else-if="errorMessage" banner :message="errorMessage" show-icon type="warning" />

    <main class="data-layout">
      <nav class="evidence-nav" aria-label="数据证据导航">
        <button v-for="item in navigation" :key="item.id" :class="{ active: selected === item.id }" type="button" @click="selected = item.id">
          <span>{{ item.label }}</span><Tag :color="item.ready ? 'success' : 'default'">{{ item.ready ? '已获取' : '等待' }}</Tag>
        </button>
      </nav>

      <section class="evidence-detail">
        <template v-if="selected === 'quality' && quality">
          <header class="section-heading"><div><span>DQM</span><h2>{{ quality.reportUid }}</h2></div><Tag color="error">{{ quality.qualityStatus }}</Tag></header>
          <dl class="fact-grid">
            <div><dt>总行数</dt><dd>{{ quality.totalRows.toLocaleString() }}</dd></div>
            <div><dt>失败行数</dt><dd>{{ quality.failedRows.toLocaleString() }}</dd></div>
            <div><dt>通过率</dt><dd>{{ percent(quality.passRate) }}</dd></div>
            <div><dt>检查时间</dt><dd>{{ quality.checkedAt }}</dd></div>
          </dl>
          <div v-if="quality.contractCheck" class="contract-row">
            <div><span>实际字段</span><strong>{{ quality.contractCheck.actualFieldCount }}</strong></div>
            <div class="arrow">→</div>
            <div><span>契约期望</span><strong>{{ quality.contractCheck.expectedFieldCount }}</strong></div>
            <Tag color="error">{{ quality.contractCheck.status }}</Tag>
          </div>
          <ul class="rule-list"><li v-for="rule in quality.ruleResults" :key="rule.name"><span>{{ rule.name }}</span><Tag :color="rule.status === 'PASSED' ? 'success' : 'error'">{{ rule.status }}</Tag><small>{{ rule.failedRows }} 行失败</small></li></ul>
        </template>

        <template v-else-if="selected === 'schema' && schema">
          <header class="section-heading"><div><span>DGV</span><h2>{{ schema.assetName }}</h2></div><Tag>v{{ schema.schemaVersion }} · {{ schema.fieldCount }} 字段</Tag></header>
          <div class="hash-row"><span>Schema Hash</span><code>{{ schema.schemaHash }}</code><span>{{ schema.capturedAt }}</span></div>
          <Table :columns="schemaColumns" :data-source="schema.fields" :pagination="{ pageSize: 12, showSizeChanger: false }" row-key="name" size="small">
            <template #bodyCell="{ column, record }"><Tag v-if="column.key === 'nullable'">{{ record.nullable ? '是' : '否' }}</Tag></template>
          </Table>
        </template>

        <template v-else-if="selected === 'lineage' && lineage">
          <header class="section-heading"><div><span>DGV</span><h2>资产血缘</h2></div><div><Tag v-if="lineage.truncated" color="warning">结果已截断</Tag><Tag v-if="lineage.cycleDetected" color="error">检测到环</Tag></div></header>
          <div class="lineage-flow">
            <div v-for="node in lineage.nodes" :key="node.assetUid" :class="['lineage-node', { root: node.assetUid === lineage.rootAssetUid }]">
              <strong>{{ node.name }}</strong><span>{{ node.type }}</span><small>{{ node.schemaSnapshotUid || '无快照' }}</small>
            </div>
          </div>
          <table class="edge-table"><thead><tr><th>源资产</th><th>转换</th><th>目标资产</th><th>工作流</th></tr></thead><tbody><tr v-for="edge in lineage.edges" :key="edge.edgeUid"><td>{{ edge.sourceAssetUid }}</td><td>{{ edge.transformType }}</td><td>{{ edge.targetAssetUid }}</td><td>{{ edge.workflowUid || '-' }}</td></tr></tbody></table>
        </template>

        <template v-else-if="selected === 'workflow' && workflow">
          <header class="section-heading"><div><span>TSK</span><h2>{{ workflow.workflowName }}</h2></div><Tag color="success">{{ workflow.status }}</Tag></header>
          <div class="workflow-actions"><span>{{ workflow.instanceUid }} · {{ workflow.triggerType }}</span><Button size="small" @click="loadLogSummary">加载脱敏日志</Button></div>
          <Table :columns="nodeColumns" :data-source="workflow.nodes" :pagination="false" row-key="nodeKey" size="small" />
        </template>

        <Empty v-else description="当前证据尚未加载" />
        <footer v-if="meta[selected]" class="technical-meta">{{ meta[selected].source }} · {{ meta[selected].evidenceId }} · {{ meta[selected].observedAt }}</footer>
      </section>
    </main>
  </div>
</template>

<style scoped>
.agent-page { background: hsl(var(--background)); color: hsl(var(--foreground)); min-height: 100%; }
.data-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); min-height: 650px; }
.evidence-nav { border-right: 1px solid hsl(var(--border)); padding: 14px 10px; }
.evidence-nav button { align-items: center; background: transparent; border: 0; border-radius: 6px; color: inherit; cursor: pointer; display: flex; justify-content: space-between; padding: 10px 12px; width: 100%; }
.evidence-nav button:hover, .evidence-nav button.active { background: hsl(var(--accent)); }
.evidence-detail { min-width: 0; padding: 22px 26px; }
.section-heading { align-items: center; border-bottom: 1px solid hsl(var(--border)); display: flex; justify-content: space-between; padding-bottom: 14px; }
.section-heading span { color: hsl(var(--muted-foreground)); font-size: 11px; }.section-heading h2 { font-size: 18px; margin: 4px 0 0; }
.fact-grid { display: grid; gap: 1px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 18px 0; }.fact-grid div { background: hsl(var(--muted)); padding: 12px; }.fact-grid dt { color: hsl(var(--muted-foreground)); font-size: 11px; }.fact-grid dd { margin: 6px 0 0; }
.contract-row { align-items: center; border-block: 1px solid hsl(var(--border)); display: flex; gap: 20px; padding: 14px 4px; }.contract-row div { display: grid; }.contract-row span { color: hsl(var(--muted-foreground)); font-size: 11px; }.contract-row strong { font-size: 24px; }.contract-row .arrow { color: hsl(var(--muted-foreground)); font-size: 20px; }
.rule-list { list-style: none; margin: 14px 0; padding: 0; }.rule-list li { align-items: center; border-bottom: 1px solid hsl(var(--border)); display: grid; gap: 10px; grid-template-columns: 1fr auto 120px; padding: 10px 4px; }.rule-list small { color: hsl(var(--muted-foreground)); text-align: right; }
.hash-row, .workflow-actions { align-items: center; display: flex; gap: 14px; justify-content: space-between; padding: 14px 0; }.hash-row code { background: hsl(var(--muted)); border-radius: 4px; flex: 1; overflow: hidden; padding: 6px 8px; text-overflow: ellipsis; white-space: nowrap; }
.lineage-flow { display: flex; gap: 12px; overflow-x: auto; padding: 22px 0; }.lineage-node { border: 1px solid hsl(var(--border)); border-radius: 6px; display: grid; gap: 6px; min-width: 190px; padding: 12px; }.lineage-node.root { border-color: hsl(var(--primary)); }.lineage-node span,.lineage-node small { color: hsl(var(--muted-foreground)); }
.edge-table { border-collapse: collapse; font-size: 12px; width: 100%; }.edge-table th,.edge-table td { border-bottom: 1px solid hsl(var(--border)); padding: 10px; text-align: left; overflow-wrap: anywhere; }
.technical-meta { border-top: 1px solid hsl(var(--border)); color: hsl(var(--muted-foreground)); font-size: 11px; margin-top: 20px; padding-top: 12px; overflow-wrap: anywhere; }
@media (max-width: 860px) { .data-layout { grid-template-columns: 1fr; }.evidence-nav { border-bottom: 1px solid hsl(var(--border)); border-right: 0; display: flex; overflow-x: auto; }.evidence-nav button { min-width: 150px; }.fact-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .evidence-detail { padding: 16px; }.fact-grid { grid-template-columns: 1fr; }.contract-row { align-items: flex-start; flex-wrap: wrap; }.rule-list li { grid-template-columns: 1fr auto; }.rule-list small { grid-column: 1 / -1; text-align: left; } }
</style>
