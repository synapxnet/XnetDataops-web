<script lang="ts" setup>
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted } from 'vue';
import {
  Table,
  Tag,
  Button,
  Space,
  Select,
  SelectOption,
  message,
} from 'ant-design-vue';
import { getEvents, acknowledgeEvent, resolveEvent } from '../api/monitor';
import type { MonitorEvent } from '../api/types';

const loading = ref(false);
const dataList = ref<MonitorEvent[]>([]);
const statusFilter = ref<string | undefined>(undefined);

const columns = [
  { title: '监控ID', dataIndex: 'monitorId', key: 'monitorId', width: 100 },
  { title: '事件类型', dataIndex: 'eventType', key: 'eventType', width: 120 },
  { title: '事件值', dataIndex: 'eventValue', key: 'eventValue', width: 120 },
  {
    title: '期望值',
    dataIndex: 'expectedValue',
    key: 'expectedValue',
    width: 120,
  },
  { title: '消息', dataIndex: 'message', key: 'message', ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '检测时间', dataIndex: 'detectedAt', key: 'detectedAt', width: 180 },
  { title: '操作', key: 'action', width: 180 },
];

const eventTypeColorMap: Record<string, string> = {
  anomaly: 'red',
  warning: 'orange',
  normal: 'green',
};
const statusColorMap: Record<string, string> = {
  open: 'red',
  acknowledged: 'orange',
  resolved: 'green',
};

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
async function fetchList() {
  loading.value = true;
  try {
    const res = await getEvents(undefined, statusFilter.value);
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取事件列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

/** 更新状态筛选并查询。 Update the status filter and reload. */
function handleStatusChange() {
  fetchList();
}

/** 提交告警确认并刷新列表。 Acknowledge an alert and refresh the list. */
async function handleAcknowledge(record: MonitorEvent) {
  try {
    await acknowledgeEvent(record.id);
    message.success('已确认');
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

/** 提交问题解决状态并刷新列表。 Resolve the selected issue and refresh the list. */
async function handleResolve(record: MonitorEvent) {
  try {
    await resolveEvent(record.id);
    message.success('已解决');
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <DataPage
    description="持续关注数据健康、监控事件与服务目标。"
    title="监控事件"
  >
    <template #extra>
      <Select
        v-model:value="statusFilter"
        placeholder="按状态筛选"
        allow-clear
        style="width: 160px"
        @change="handleStatusChange"
      >
        <SelectOption value="open">待处理</SelectOption>
        <SelectOption value="acknowledged">已确认</SelectOption>
        <SelectOption value="resolved">已解决</SelectOption>
      </Select>
    </template>
    <Table
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1100 }"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'eventType'">
          <Tag
            :color="eventTypeColorMap[(_record as any).eventType] || 'default'"
            >{{ (_record as any).eventType }}</Tag
          >
        </template>
        <template v-if="column.key === 'status'">
          <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{
            (_record as any).status
          }}</Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              type="link"
              size="small"
              @click="handleAcknowledge(_record as MonitorEvent)"
              v-if="(_record as any).status === 'open'"
              >确认</Button
            >
            <Button
              type="link"
              size="small"
              @click="handleResolve(_record as MonitorEvent)"
              v-if="(_record as any).status !== 'resolved'"
              >解决</Button
            >
          </Space>
        </template>
      </template>
    </Table>
  </DataPage>
</template>
