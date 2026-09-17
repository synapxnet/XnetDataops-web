<script lang="ts" setup>
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted, computed } from 'vue';
import { Table, Tag, Button, Modal, message } from 'ant-design-vue';
import { getLineageList, deleteLineage } from './api/lineage';
import type { DataLineage } from './api/types';

const loading = ref(false);
// 将真实关系端点布局为可扫描图节点。 Lay out actual relationship endpoints as readable graph nodes.
const graphNodes = computed(() =>
  [
    ...new Set(
      dataList.value.flatMap((edge) => [
        edge.sourceTableId,
        edge.targetTableId,
      ]),
    ),
  ].map((id, index) => ({
    id,
    x: 30 + (index % 3) * 280,
    y: 30 + Math.floor(index / 3) * 110,
  })),
);
const graphHeight = computed(() =>
  Math.max(150, Math.ceil(graphNodes.value.length / 3) * 110 + 30),
);
/** 计算真实关系的曲线，保留方向和自环。 Compute relationship curves while preserving direction and self-loops. */
function relationPath(source: number, target: number) {
  const a = graphNodes.value.find((node) => node.id === source),
    b = graphNodes.value.find((node) => node.id === target);
  if (!a || !b) return '';
  if (source === target)
    return (
      'M ' +
      (a.x + 110) +
      ' ' +
      a.y +
      ' C ' +
      (a.x + 200) +
      ' ' +
      (a.y - 35) +
      ' ' +
      (a.x + 200) +
      ' ' +
      (a.y + 85) +
      ' ' +
      (a.x + 110) +
      ' ' +
      (a.y + 50)
    );
  return (
    'M ' +
    (a.x + 110) +
    ' ' +
    (a.y + 25) +
    ' Q ' +
    ((a.x + b.x) / 2 + 150) +
    ' ' +
    ((a.y + b.y) / 2 - 35) +
    ' ' +
    (b.x + 110) +
    ' ' +
    (b.y + 25)
  );
}
const dataList = ref<DataLineage[]>([]);

const columns = [
  {
    title: '源表ID',
    dataIndex: 'sourceTableId',
    key: 'sourceTableId',
    width: 100,
  },
  {
    title: '目标表ID',
    dataIndex: 'targetTableId',
    key: 'targetTableId',
    width: 100,
  },
  {
    title: '转换类型',
    dataIndex: 'transformType',
    key: 'transformType',
    width: 100,
  },
  {
    title: '关系描述',
    dataIndex: 'relationshipDesc',
    key: 'relationshipDesc',
    ellipsis: true,
  },
  { title: '工作流ID', dataIndex: 'workflowId', key: 'workflowId', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100 },
];

const typeColorMap: Record<string, string> = {
  etl: 'blue',
  sql: 'green',
  api: 'orange',
};

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
async function fetchList() {
  loading.value = true;
  try {
    const res = await getLineageList();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取血缘数据失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

/** 确认后删除选中记录。 Delete the selected record after confirmation. */
function handleDelete(record: DataLineage) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除此血缘关系吗？',
    okType: 'danger',
    async onOk() {
      try {
        await deleteLineage(record.id);
        message.success('删除成功');
        fetchList();
      } catch (e: any) {
        message.error('删除失败: ' + e.message);
        throw e;
      }
    },
  });
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <DataPage
    description="管理数据目录、血缘与治理证据，贯穿数据生命周期。"
    title="数据血缘"
  >
    <Table
      :scroll="{ x: 'max-content' }"
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'transformType'">
          <Tag
            :color="typeColorMap[(_record as any).transformType] || 'default'"
            >{{ (_record as any).transformType }}</Tag
          >
        </template>
        <template v-if="column.key === 'action'">
          <Button
            type="link"
            size="small"
            danger
            @click="handleDelete(_record as DataLineage)"
            >删除</Button
          >
        </template>
      </template>
    </Table>
    <section class="lineage-visual" aria-label="已登记的数据血缘关系">
      <h2>关系图</h2>
      <p v-if="!graphNodes.length">暂无已登记的血缘关系。</p>
      <svg
        v-else
        :viewBox="'0 0 900 ' + graphHeight"
        role="img"
        aria-label="数据表依赖关系"
      >
        <defs>
          <marker
            id="lineage-arrow"
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
          v-for="edge in dataList"
          :key="edge.id"
          :d="relationPath(edge.sourceTableId, edge.targetTableId)"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          marker-end="url(#lineage-arrow)"
        />
        <g
          v-for="node in graphNodes"
          :key="node.id"
          :transform="'translate(' + node.x + ',' + node.y + ')'"
        >
          <rect width="220" height="50" rx="10" />
          <text x="110" y="30" text-anchor="middle">数据表 #{{ node.id }}</text>
        </g>
      </svg>
    </section>
  </DataPage>
</template>

<style scoped>
.lineage-visual {
  margin-top: 24px;
  padding: 20px;
  border: 1px solid hsl(var(--border));
  border-radius: var(--dataops-radius);
  color: hsl(var(--primary));
  overflow: auto;
}
.lineage-visual h2 {
  font-size: 14px;
  font-weight: 650;
  color: hsl(var(--foreground));
  margin-bottom: 16px;
}
.lineage-visual svg {
  display: block;
  width: 100%;
  min-width: 540px;
}
.lineage-visual rect {
  fill: hsl(var(--card));
  stroke: hsl(var(--border));
}
.lineage-visual text {
  fill: hsl(var(--foreground));
  font-size: 13px;
}
.lineage-visual p {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}
</style>
