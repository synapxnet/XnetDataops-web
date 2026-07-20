<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, Select, Space, message } from 'ant-design-vue';
import { getAuditLogs } from '../api/audit';
import type { AuditLog } from '../api/types';

const loading = ref(false);
const dataList = ref<AuditLog[]>([]);
const filterModule = ref<string | undefined>(undefined);
const filterAction = ref<string | undefined>(undefined);

const moduleOptions = [
  { label: 'DSM', value: 'DSM' },
  { label: 'DIM', value: 'DIM' },
  { label: 'DDV', value: 'DDV' },
  { label: 'TSK', value: 'TSK' },
  { label: 'DQM', value: 'DQM' },
  { label: 'DGV', value: 'DGV' },
  { label: 'DAS', value: 'DAS' },
  { label: 'DAP', value: 'DAP' },
  { label: 'DMS', value: 'DMS' },
  { label: 'DOB', value: 'DOB' },
];

const actionOptions = [
  { label: 'create', value: 'create' },
  { label: 'update', value: 'update' },
  { label: 'delete', value: 'delete' },
  { label: 'query', value: 'query' },
  { label: 'export', value: 'export' },
  { label: 'login', value: 'login' },
  { label: 'logout', value: 'logout' },
];

const columns = [
  { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
  { title: '模块', dataIndex: 'module', key: 'module', width: 100 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 100 },
  { title: '目标类型', dataIndex: 'targetType', key: 'targetType', width: 120 },
  { title: '目标名称', dataIndex: 'targetName', key: 'targetName', ellipsis: true },
  { title: 'IP地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 140 },
  { title: '操作时间', dataIndex: 'operateAt', key: 'operateAt', width: 180 },
];

const moduleColorMap: Record<string, string> = {
  DSM: 'blue',
  DIM: 'cyan',
  DDV: 'purple',
  TSK: 'orange',
  DQM: 'green',
  DGV: 'gold',
  DAS: 'magenta',
  DAP: 'lime',
  DMS: 'red',
  DOB: 'geekblue',
};

const actionColorMap: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  query: 'default',
  export: 'purple',
  login: 'cyan',
  logout: 'orange',
};

async function fetchList() {
  loading.value = true;
  try {
    const res = await getAuditLogs(filterModule.value, filterAction.value);
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取审计日志失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function handleModuleChange(value: string) {
  filterModule.value = value;
  fetchList();
}

function handleActionChange(value: string) {
  filterAction.value = value;
  fetchList();
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="操作审计日志">
      <template #extra>
        <Space>
          <Select
            v-model:value="filterModule"
            :options="moduleOptions"
            placeholder="按模块筛选"
            allow-clear
            style="width: 150px"
            @change="handleModuleChange"
          />
          <Select
            v-model:value="filterAction"
            :options="actionOptions"
            placeholder="按操作筛选"
            allow-clear
            style="width: 150px"
            @change="handleActionChange"
          />
        </Space>
      </template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1000 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'module'">
            <Tag :color="moduleColorMap[(_record as any).module] || 'default'">{{ (_record as any).module }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Tag :color="actionColorMap[(_record as any).action] || 'default'">{{ (_record as any).action }}</Tag>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
