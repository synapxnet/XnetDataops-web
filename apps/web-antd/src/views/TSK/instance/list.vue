<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, Button, Space, Modal, message } from 'ant-design-vue';
import { getTaskInstances, getNodeInstances } from '../api/taskInstance';
import type { TaskInstance, NodeInstance } from '../api/types';

const loading = ref(false);
const dataList = ref<TaskInstance[]>([]);

const columns = [
  { title: '实例ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '工作流ID', dataIndex: 'workflowId', key: 'workflowId', width: 100 },
  { title: '触发方式', dataIndex: 'triggerType', key: 'triggerType', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
  { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 180 },
  { title: '操作', key: 'action', width: 120 },
];

const statusColorMap: Record<string, string> = {
  pending: 'default', running: 'blue', success: 'green', failed: 'red', cancelled: 'orange',
};

const nodeModalVisible = ref(false);
const nodeInstances = ref<NodeInstance[]>([]);
const nodeLoading = ref(false);

const nodeColumns = [
  { title: '节点Key', dataIndex: 'nodeKey', key: 'nodeKey' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '开始', dataIndex: 'startTime', key: 'startTime', width: 180 },
  { title: '结束', dataIndex: 'endTime', key: 'endTime', width: 180 },
];

async function fetchList() {
  loading.value = true;
  try {
    const res = await getTaskInstances();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取运行实例失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

async function showNodes(record: TaskInstance) {
  nodeModalVisible.value = true;
  nodeLoading.value = true;
  try {
    const res = await getNodeInstances(record.id);
    nodeInstances.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取节点实例失败: ' + e.message);
  } finally {
    nodeLoading.value = false;
  }
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="运行实例">
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ (_record as any).status }}</Tag>
          </template>
          <template v-if="column.key === 'triggerType'">
            <Tag :color="(_record as any).triggerType === 'manual' ? 'blue' : 'green'">{{ (_record as any).triggerType }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" @click="showNodes(_record as TaskInstance)">节点详情</Button>
          </template>
        </template>
      </Table>
    </Card>
    <Modal v-model:open="nodeModalVisible" title="节点执行详情" :footer="null" width="700px">
      <Table :columns="nodeColumns" :data-source="nodeInstances" :loading="nodeLoading" row-key="id" size="small">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ (_record as any).status }}</Tag>
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>
