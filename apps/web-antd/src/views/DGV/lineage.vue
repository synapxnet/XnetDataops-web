<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, Button, Space, Modal, message } from 'ant-design-vue';
import { getLineageList, deleteLineage } from './api/lineage';
import type { DataLineage } from './api/types';

const loading = ref(false);
const dataList = ref<DataLineage[]>([]);

const columns = [
  { title: '源表ID', dataIndex: 'sourceTableId', key: 'sourceTableId', width: 100 },
  { title: '目标表ID', dataIndex: 'targetTableId', key: 'targetTableId', width: 100 },
  { title: '转换类型', dataIndex: 'transformType', key: 'transformType', width: 100 },
  { title: '关系描述', dataIndex: 'relationshipDesc', key: 'relationshipDesc', ellipsis: true },
  { title: '工作流ID', dataIndex: 'workflowId', key: 'workflowId', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 100 },
];

const typeColorMap: Record<string, string> = { etl: 'blue', sql: 'green', api: 'orange' };

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

function handleDelete(record: DataLineage) {
  Modal.confirm({
    title: '确认删除', content: '确定要删除此血缘关系吗？', okType: 'danger',
    async onOk() {
      try { await deleteLineage(record.id); message.success('删除成功'); fetchList(); }
      catch (e: any) { message.error('删除失败: ' + e.message); }
    },
  });
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="数据血缘">
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'transformType'">
            <Tag :color="typeColorMap[(_record as any).transformType] || 'default'">{{ (_record as any).transformType }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" danger @click="handleDelete(_record as DataLineage)">删除</Button>
          </template>
        </template>
      </Table>
      <div class="text-muted-foreground border-border mt-4 rounded-lg border border-dashed p-10 text-center">
        可视化血缘图（可接入 AntV G6 实现）
      </div>
    </Card>
  </div>
</template>
