<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, InputNumber, Button, Space, message } from 'ant-design-vue';
import { getCallLogs } from '../api/apiConfig';
import type { ApiCallLog } from '../api/types';

const loading = ref(false);
const dataList = ref<ApiCallLog[]>([]);
const filterApiConfigId = ref<number | undefined>(undefined);

const columns = [
  { title: 'API配置ID', dataIndex: 'apiConfigId', key: 'apiConfigId', width: 120 },
  { title: '响应状态', dataIndex: 'responseStatus', key: 'responseStatus', width: 120 },
  { title: '响应时间(ms)', dataIndex: 'responseTime', key: 'responseTime', width: 130 },
  { title: 'IP地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 160 },
  { title: '调用时间', dataIndex: 'calledAt', key: 'calledAt', width: 200 },
];

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'green';
  if (status >= 300 && status < 400) return 'blue';
  if (status >= 400 && status < 500) return 'orange';
  if (status >= 500) return 'red';
  return 'default';
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getCallLogs(filterApiConfigId.value);
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取调用日志失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchList();
}

function handleReset() {
  filterApiConfigId.value = undefined;
  fetchList();
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="调用日志">
      <template #extra>
        <Space>
          <InputNumber v-model:value="filterApiConfigId" placeholder="按API配置ID筛选" :min="1" style="width: 200px;" />
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 800 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'responseStatus'">
            <Tag :color="statusColor((_record as any).responseStatus)">{{ (_record as any).responseStatus }}</Tag>
          </template>
          <template v-if="column.key === 'responseTime'">
            <span>{{ (_record as any).responseTime }} ms</span>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
