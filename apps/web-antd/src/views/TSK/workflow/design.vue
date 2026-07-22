<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Button, Space, message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import { getWorkflow, getNodes, getEdges } from '../api/workflow';
import type { Workflow, WorkflowNode, WorkflowEdge } from '../api/types';

const route = useRoute();
const router = useRouter();
const workflowId = ref(Number(route.params.id));
const workflow = ref<Workflow | null>(null);
const nodes = ref<WorkflowNode[]>([]);
const edges = ref<WorkflowEdge[]>([]);

onMounted(async () => {
  try {
    workflow.value = await getWorkflow(workflowId.value);
    nodes.value = await getNodes(workflowId.value);
    edges.value = await getEdges(workflowId.value);
  } catch (e: any) {
    message.error('加载工作流失败: ' + e.message);
  }
});
</script>

<template>
  <div class="p-4">
    <Card :title="`DAG编排 - ${workflow?.name || ''}`">
      <template #extra>
        <Space>
          <Button @click="router.back()">返回</Button>
        </Space>
      </template>
      <div class="text-muted-foreground border-border flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div style="text-align: center;">
          <p style="font-size: 16px;">DAG 可视化编排区域</p>
          <p>节点数量: {{ nodes.length }} | 连线数量: {{ edges.length }}</p>
          <p class="text-muted-foreground text-xs">可接入 AntV X6 或 vue-flow 实现可视化 DAG 编排</p>
        </div>
      </div>
    </Card>
  </div>
</template>
