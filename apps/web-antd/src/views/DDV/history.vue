<script lang="ts" setup>
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted } from 'vue';
import { Table, Tag, message } from 'ant-design-vue';
import { getQueryHistory } from './api/sqlScript';
import type { QueryHistory } from './api/types';

const loading = ref(false);
const dataList = ref<QueryHistory[]>([]);

const columns = [
  {
    title: 'SQL内容',
    dataIndex: 'sqlContent',
    key: 'sqlContent',
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'executeStatus',
    key: 'executeStatus',
    width: 100,
  },
  {
    title: '影响行数',
    dataIndex: 'rowsAffected',
    key: 'rowsAffected',
    width: 100,
  },
  { title: '耗时(ms)', dataIndex: 'durationMs', key: 'durationMs', width: 100 },
  { title: '执行时间', dataIndex: 'executedAt', key: 'executedAt', width: 180 },
  { title: '错误信息', dataIndex: 'errorMsg', key: 'errorMsg', ellipsis: true },
];

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
async function fetchList() {
  loading.value = true;
  try {
    const res = await getQueryHistory();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取查询历史失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <DataPage
    description="查询、开发与复用数据逻辑，保留执行过程。"
    title="查询历史"
  >
    <Table
      :scroll="{ x: 'max-content' }"
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'executeStatus'">
          <Tag
            :color="
              (_record as any).executeStatus === 'success' ? 'green' : 'red'
            "
            >{{ (_record as any).executeStatus }}</Tag
          >
        </template>
      </template>
    </Table>
  </DataPage>
</template>
