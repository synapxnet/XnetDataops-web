<script lang="ts" setup>
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted } from 'vue';
import { Table, Tag, Button, Space, message } from 'ant-design-vue';
import {
  getQualityAlerts,
  resolveAlert,
  acknowledgeAlert,
} from '../api/qualityReport';
import type { QualityAlert } from '../api/types';

const loading = ref(false);
const dataList = ref<QualityAlert[]>([]);

const columns = [
  { title: '规则ID', dataIndex: 'ruleId', key: 'ruleId', width: 100 },
  { title: '告警级别', dataIndex: 'alertLevel', key: 'alertLevel', width: 100 },
  { title: '告警信息', dataIndex: 'message', key: 'message', ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  {
    title: '触发时间',
    dataIndex: 'triggeredAt',
    key: 'triggeredAt',
    width: 180,
  },
  { title: '操作', key: 'action', width: 180 },
];

const levelColorMap: Record<string, string> = {
  info: 'blue',
  warning: 'orange',
  critical: 'red',
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
    const res = await getQualityAlerts();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取告警列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

/** 提交告警确认并刷新列表。 Acknowledge an alert and refresh the list. */
async function handleAcknowledge(record: QualityAlert) {
  try {
    await acknowledgeAlert(record.id);
    message.success('已确认');
    fetchList();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

/** 提交问题解决状态并刷新列表。 Resolve the selected issue and refresh the list. */
async function handleResolve(record: QualityAlert) {
  try {
    await resolveAlert(record.id);
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
    description="建立质量规则，定位异常并追踪处理结果。"
    title="质量告警"
  >
    <Table
      :scroll="{ x: 'max-content' }"
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'alertLevel'">
          <Tag
            :color="levelColorMap[(_record as any).alertLevel] || 'default'"
            >{{ (_record as any).alertLevel }}</Tag
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
              @click="handleAcknowledge(_record as QualityAlert)"
              v-if="(_record as any).status === 'open'"
              >确认</Button
            >
            <Button
              type="link"
              size="small"
              @click="handleResolve(_record as QualityAlert)"
              v-if="(_record as any).status !== 'resolved'"
              >解决</Button
            >
          </Space>
        </template>
      </template>
    </Table>
  </DataPage>
</template>
