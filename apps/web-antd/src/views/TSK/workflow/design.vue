<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：工作流依赖图编辑。Purpose: Edit workflow dependency graphs.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
-->
<script lang="ts" setup>
const pageRequestState = pageState();
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Alert,
  Button,
  Empty,
  Form,
  FormItem,
  Input,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import DataPage from '#/components/data-page/index.vue';
import { pageState } from '#/components/data-page/request-state';
import { getWorkflow, getNodes, getEdges, saveDAG } from '../api/workflow';
import type { Workflow, WorkflowNode, WorkflowEdge } from '../api/types';
import { validateDAG } from './dag-validation';
const route = useRoute(),
  router = useRouter();
const workflowId = Number(route.params.id),
  workflow = ref<Workflow | null>(null),
  nodes = ref<WorkflowNode[]>([]),
  edges = ref<WorkflowEdge[]>([]);
const selectedKey = ref(''),
  source = ref<string>(),
  target = ref<string>(),
  saving = ref(false),
  loaded = ref(false),
  error = ref(''),
  savedAt = ref('');
// 为节点和真实依赖生成有界画布坐标。 Compute bounded canvas coordinates for nodes and actual dependencies.
const graphNodes = computed(() =>
  nodes.value.map((node, index) => ({
    ...node,
    x: 20 + (index % 3) * 260,
    y: 30 + Math.floor(index / 3) * 120,
  })),
);
const graphHeight = computed(() =>
  Math.max(180, Math.ceil(nodes.value.length / 3) * 120 + 20),
);
/** 生成连线曲线并保留方向。 Generate dependency curves while preserving direction. */
function graphEdge(sourceKey: string, targetKey: string) {
  const a = graphNodes.value.find((node) => node.nodeKey === sourceKey),
    b = graphNodes.value.find((node) => node.nodeKey === targetKey);
  return a && b
    ? 'M ' +
        (a.x + 105) +
        ' ' +
        (a.y + 32) +
        ' Q ' +
        ((a.x + b.x) / 2 + 160) +
        ' ' +
        ((a.y + b.y) / 2 - 22) +
        ' ' +
        (b.x + 105) +
        ' ' +
        (b.y + 32)
    : '';
}
const selected = computed(() =>
  nodes.value.find((node) => node.nodeKey === selectedKey.value),
);
const options = computed(() =>
  nodes.value.map((node) => ({ label: node.nodeName, value: node.nodeKey })),
);
/** 原子载入图，避免部分响应成为可保存草稿。 Load the graph atomically so partial responses never become editable drafts. */
async function load() {
  try {
    const [w, n, e] = await Promise.all([
      getWorkflow(workflowId),
      getNodes(workflowId),
      getEdges(workflowId),
    ]);
    workflow.value = w;
    nodes.value = n;
    edges.value = e;
    selectedKey.value = n[0]?.nodeKey ?? '';
    loaded.value = true;
  } catch {
    error.value = '工作流加载失败，请刷新后重试';
  }
}
/** 新增有唯一标识的可配置节点并保留草稿。 Add a uniquely identified configurable node and mark the draft dirty. */
function addNode() {
  const key = 'node_' + Date.now();
  nodes.value.push({
    id: 0,
    workflowId,
    nodeKey: key,
    nodeName: '新节点',
    nodeType: 'sql',
    configJson: '{}',
    positionX: 0,
    positionY: 0,
  });
  selectedKey.value = key;
  pageState().dirty = true;
}
/** 删除选中节点及所有相连依赖。 Remove the selected node and every incident dependency. */
function removeNode() {
  nodes.value = nodes.value.filter(
    (node) => node.nodeKey !== selectedKey.value,
  );
  edges.value = edges.value.filter(
    (edge) =>
      edge.sourceNodeKey !== selectedKey.value &&
      edge.targetNodeKey !== selectedKey.value,
  );
  selectedKey.value = nodes.value[0]?.nodeKey ?? '';
  pageState().dirty = true;
}
/** 验证候选连线，拒绝形成循环或重复依赖。 Validate a candidate edge and reject cycles or duplicate dependencies. */
function addEdge() {
  if (!source.value || !target.value) {
    error.value = '请选择连线的起点与终点';
    return;
  }
  const next = [
    ...edges.value,
    {
      id: 0,
      workflowId,
      sourceNodeKey: source.value,
      targetNodeKey: target.value,
    },
  ];
  const reason = validateDAG(nodes.value, next);
  if (reason) {
    error.value = reason;
    return;
  }
  edges.value = next;
  error.value = '';
  pageState().dirty = true;
}
/** 删除指定依赖并标记未保存修改。 Remove a dependency and mark the edit as unsaved. */
function removeEdge(index: number) {
  edges.value.splice(index, 1);
  pageState().dirty = true;
}
/** 验证后提交真实DAG接口，失败时保持所有节点与连线。 Submit the actual DAG API after validation and retain all edits on failure. */
async function save() {
  if (saving.value || !loaded.value) return;
  savedAt.value = '';
  error.value = validateDAG(nodes.value, edges.value);
  if (error.value) return;
  saving.value = true;
  try {
    await saveDAG(
      workflowId,
      nodes.value.map((node, index) => ({
        ...node,
        positionX: (index % 3) * 240,
        positionY: Math.floor(index / 3) * 140,
      })),
      edges.value,
    );
    message.success('工作流编排已保存');
    // 只清理发起保存的页面草稿，离开后不改动新页面状态。 Clear only the submitting page draft without changing a newly opened page.
    pageRequestState.dirty = false;
    savedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  } catch {
    error.value = '保存未完成，编排草稿已保留';
  } finally {
    saving.value = false;
  }
}
onMounted(load);
</script>
<template>
  <DataPage
    :title="workflow?.name ? workflow.name + ' · 工作流编排' : '工作流编排'"
    description="连接数据任务，明确依赖关系；检查通过后保存到工作流。"
  >
    <template #extra
      ><Button @click="router.back()">返回</Button
      ><Button :disabled="!loaded || saving" @click="addNode">添加节点</Button
      ><Button
        type="primary"
        :loading="saving"
        :disabled="!loaded"
        @click="save"
        >保存编排</Button
      ></template
    >
    <Alert
      v-if="error"
      :message="error"
      type="warning"
      show-icon
      class="mb-4"
    />
    <Alert
      v-else-if="savedAt && !pageRequestState.dirty"
      :message="'工作流编排已保存 · ' + savedAt"
      type="success"
      show-icon
      class="mb-4"
      role="status"
    />
    <div class="dag-workspace">
      <section class="dag-board">
        <div class="dag-summary">
          <Tag color="processing">{{ nodes.length }} 个节点</Tag
          ><Tag>{{ edges.length }} 条依赖</Tag>
        </div>
        <div v-if="nodes.length" class="dag-canvas">
          <svg
            :viewBox="'0 0 800 ' + graphHeight"
            role="img"
            aria-label="工作流节点与依赖图"
          >
            <defs>
              <marker
                id="dag-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            <path
              v-for="edge in edges"
              :key="edge.sourceNodeKey + edge.targetNodeKey"
              :d="graphEdge(edge.sourceNodeKey, edge.targetNodeKey)"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              marker-end="url(#dag-arrow)"
            />
            <g
              v-for="node in graphNodes"
              :key="node.nodeKey"
              :transform="'translate(' + node.x + ',' + node.y + ')'"
              class="dag-graph-node"
              :class="{ selected: node.nodeKey === selectedKey }"
              tabindex="0"
              role="button"
              :aria-label="'编辑节点 ' + node.nodeName"
              @click="selectedKey = node.nodeKey"
              @keydown.enter="selectedKey = node.nodeKey"
            >
              <rect width="210" height="70" rx="12" />
              <text x="16" y="28">
                {{
                  node.nodeName.length > 12
                    ? node.nodeName.slice(0, 12) + '…'
                    : node.nodeName
                }}
              </text>
              <text x="16" y="52" class="dag-node-type">
                {{ node.nodeType }}
              </text>
            </g>
          </svg>
        </div>
        <Empty
          v-if="loaded && !nodes.length"
          description="添加第一个节点，开始编排"
        />
        <div class="dag-edges">
          <h2>依赖关系</h2>
          <p v-if="!edges.length" class="dag-muted">
            还没有依赖。独立节点可以并行运行。
          </p>
          <div
            v-for="(edge, index) in edges"
            :key="edge.sourceNodeKey + edge.targetNodeKey"
            class="dag-edge"
          >
            <span
              >{{
                nodes.find((node) => node.nodeKey === edge.sourceNodeKey)
                  ?.nodeName
              }}
              →
              {{
                nodes.find((node) => node.nodeKey === edge.targetNodeKey)
                  ?.nodeName
              }}</span
            ><Button type="text" danger size="small" @click="removeEdge(index)"
              >移除</Button
            >
          </div>
          <Form
            :disabled="
              pageRequestState.writePending > 0 ||
              Object.keys(pageRequestState.failures).length > 0
            "
            layout="vertical"
            ><Space wrap
              ><Select
                v-model:value="source"
                :options="options"
                placeholder="前置节点"
                style="width: 180px"
              /><Select
                v-model:value="target"
                :options="options"
                placeholder="后续节点"
                style="width: 180px"
              /><Button :disabled="!loaded || nodes.length < 2" @click="addEdge"
                >连接节点</Button
              ></Space
            ></Form
          >
        </div>
      </section>
      <aside class="dag-properties">
        <h2>节点配置</h2>
        <Form
          :disabled="
            pageRequestState.writePending > 0 ||
            Object.keys(pageRequestState.failures).length > 0
          "
          v-if="selected"
          layout="vertical"
          ><FormItem label="节点标识"
            ><Input :value="selected.nodeKey" readonly /></FormItem
          ><FormItem label="节点名称"
            ><Input
              v-model:value="selected.nodeName"
              :maxlength="120" /></FormItem
          ><FormItem label="任务类型"
            ><Input
              v-model:value="selected.nodeType"
              placeholder="sql / shell / sync" /></FormItem
          ><FormItem label="配置 JSON"
            ><Input.TextArea
              v-model:value="selected.configJson"
              :rows="10"
              spellcheck="false" /></FormItem
          ><Button danger :disabled="saving" @click="removeNode"
            >删除节点</Button
          ></Form
        >
        <p v-else class="dag-muted">选择节点后编辑任务配置。</p>
      </aside>
    </div>
  </DataPage>
</template>
<style scoped>
.dag-canvas {
  overflow: auto;
}
.dag-canvas svg {
  display: block;
  width: 100%;
  min-width: 580px;
  color: hsl(var(--primary));
}
.dag-graph-node {
  cursor: pointer;
}
.dag-graph-node rect {
  fill: hsl(var(--card));
  stroke: hsl(var(--border));
  stroke-width: 1.5;
}
.dag-graph-node.selected rect {
  stroke: hsl(var(--primary));
  stroke-width: 2.5;
}
.dag-graph-node text {
  fill: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 600;
}
.dag-graph-node .dag-node-type {
  font-size: 11px;
  font-weight: 400;
  fill: hsl(var(--muted-foreground));
}
.dag-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 24px;
}
.dag-board {
  min-width: 0;
  padding: 20px;
  border-radius: var(--dataops-radius);
  background: radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px);
  background-size: 18px 18px;
}
.dag-summary {
  margin-bottom: 20px;
}
.dag-nodes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
}
.dag-node {
  display: grid;
  gap: 7px;
  padding: 16px;
  text-align: left;
  border: 1px solid hsl(var(--border));
  border-radius: var(--dataops-radius);
  background: hsl(var(--card));
  cursor: pointer;
  overflow-wrap: anywhere;
}
.dag-node.selected {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
}
.dag-node strong {
  font-size: 14px;
}
.dag-node-number {
  font-size: 11px;
  color: hsl(var(--primary));
  font-weight: 700;
}
.dag-node > span:not(:first-child),
.dag-node small,
.dag-muted {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}
.dag-edges {
  margin-top: 28px;
}
.dag-edges h2,
.dag-properties h2 {
  font-size: 14px;
  font-weight: 650;
  margin-bottom: 18px;
}
.dag-edge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: hsl(var(--card));
  border-radius: 8px;
  gap: 12px;
}
.dag-properties {
  border-left: 1px solid hsl(var(--border));
  padding-left: 24px;
}
.dag-edges form {
  margin-top: 18px;
}
@media (max-width: 1000px) {
  .dag-workspace {
    grid-template-columns: 1fr;
  }
  .dag-properties {
    border-left: 0;
    border-top: 1px solid hsl(var(--border));
    padding: 20px 0 0;
  }
}
@media (max-width: 480px) {
  .dag-board {
    padding: 10px;
  }
  .dag-nodes {
    grid-template-columns: 1fr;
  }
}
</style>
