<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Table, Tag, Button, Space, message } from 'ant-design-vue';
import { getQualityAlerts, resolveAlert, acknowledgeAlert } from '../api/qualityReport';
import type { QualityAlert } from '../api/types';

const loading = ref(false);
const dataList = ref<QualityAlert[]>([]);

const columns = [
  { title: '规则ID', dataIndex: 'ruleId', key: 'ruleId', width: 100 },
  { title: '告警级别', dataIndex: 'alertLevel', key: 'alertLevel', width: 100 },
  { title: '告警信息', dataIndex: 'message', key: 'message', ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '触发时间', dataIndex: 'triggeredAt', key: 'triggeredAt', width: 180 },
  { title: '操作', key: 'action', width: 180 },
];

const levelColorMap: Record<string, string> = { info: 'blue', warning: 'orange', critical: 'red' };
const statusColorMap: Record<string, string> = { open: 'red', acknowledged: 'orange', resolved: 'green' };

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

async function handleAcknowledge(record: QualityAlert) {
  try { await acknowledgeAlert(record.id); message.success('已确认'); fetchList(); }
  catch (e: any) { message.error('操作失败: ' + e.message); }
}

async function handleResolve(record: QualityAlert) {
  try { await resolveAlert(record.id); message.success('已解决'); fetchList(); }
  catch (e: any) { message.error('操作失败: ' + e.message); }
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="质量告警">
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'alertLevel'">
            <Tag :color="levelColorMap[(_record as any).alertLevel] || 'default'">{{ (_record as any).alertLevel }}</Tag>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ (_record as any).status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="handleAcknowledge(_record as QualityAlert)" v-if="(_record as any).status === 'open'">确认</Button>
              <Button type="link" size="small" @click="handleResolve(_record as QualityAlert)" v-if="(_record as any).status !== 'resolved'">解决</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
