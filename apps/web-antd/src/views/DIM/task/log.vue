<script lang="ts" setup>
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted } from 'vue';
import { Table, Tag, Button, message } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import { getSyncLogs } from '../api/syncTask';
import type { SyncLog } from '../api/types';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const logs = ref<SyncLog[]>([]);
const taskId = ref(Number(route.params.id));

const columns = [
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 180 },
  { title: '结束时间', dataIndex: 'endTime', key: 'endTime', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '读取行数', dataIndex: 'rowsRead', key: 'rowsRead', width: 120 },
  {
    title: '写入行数',
    dataIndex: 'rowsWritten',
    key: 'rowsWritten',
    width: 120,
  },
  { title: '错误信息', dataIndex: 'errorMsg', key: 'errorMsg', ellipsis: true },
];

const statusColorMap: Record<string, string> = {
  running: 'blue',
  success: 'green',
  failed: 'red',
};

/** 载入当前任务执行日志。 Load execution logs for the current task. */
async function fetchLogs() {
  loading.value = true;
  try {
    const res = await getSyncLogs(taskId.value);
    logs.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取日志失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchLogs();
});
</script>

<template>
  <DataPage
    description="把数据从来源送达目标，跟踪每次同步与执行记录。"
    :title="`同步任务 #${taskId} - 执行日志`"
  >
    <template #extra>
      <Button @click="router.back()">返回</Button>
    </template>
    <Table
      :scroll="{ x: 'max-content' }"
      :columns="columns"
      :data-source="logs"
      :loading="loading"
      row-key="id"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'status'">
          <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{
            (_record as any).status
          }}</Tag>
        </template>
      </template>
    </Table>
  </DataPage>
</template>
