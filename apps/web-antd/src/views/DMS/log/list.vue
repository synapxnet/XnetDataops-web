<script lang="ts" setup>
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted } from 'vue';
import {
  Table,
  Tag,
  Space,
  Button,
  InputNumber,
  message,
} from 'ant-design-vue';
import { getTaskLogs } from '../api/masking';
import type { MaskingTaskLog } from '../api/types';

const loading = ref(false);
const dataList = ref<MaskingTaskLog[]>([]);
const filterPolicyId = ref<number | undefined>(undefined);

const columns = [
  { title: '策略ID', dataIndex: 'policyId', key: 'policyId', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '总行数', dataIndex: 'totalRows', key: 'totalRows', width: 100 },
  {
    title: '已脱敏行数',
    dataIndex: 'maskedRows',
    key: 'maskedRows',
    width: 120,
  },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
  { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 180 },
  { title: '错误信息', dataIndex: 'errorMsg', key: 'errorMsg', ellipsis: true },
];

const statusColorMap: Record<string, string> = {
  running: 'blue',
  success: 'green',
  failed: 'red',
};

const statusLabelMap: Record<string, string> = {
  running: '运行中',
  success: '成功',
  failed: '失败',
};

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
async function fetchList() {
  loading.value = true;
  try {
    const res = await getTaskLogs(filterPolicyId.value);
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取执行日志失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

/** 应用当前筛选条件。 Apply the current filters. */
function handleFilter() {
  fetchList();
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <DataPage
    description="配置敏感数据保护，保留策略与执行记录。"
    title="执行日志"
  >
    <template #extra>
      <Space>
        <InputNumber
          v-model:value="filterPolicyId"
          placeholder="按策略ID筛选"
          :min="1"
          style="width: 180px"
          @press-enter="handleFilter"
        />
        <Button @click="handleFilter">筛选</Button>
      </Space>
    </template>
    <Table
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 960 }"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'status'">
          <Tag :color="statusColorMap[(_record as any).status] || 'default'">
            {{
              statusLabelMap[(_record as any).status] || (_record as any).status
            }}
          </Tag>
        </template>
      </template>
    </Table>
  </DataPage>
</template>
