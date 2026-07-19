<script lang="ts" setup>
import { ref, onMounted, reactive } from 'vue';
import { Card, Table, Tag, Button, Modal, Form, FormItem, Input, Statistic, Row, Col, message } from 'ant-design-vue';
import { getSlaList, createSla, getSlaStats } from '../api/monitor';
import type { DataSla } from '../api/types';

const loading = ref(false);
const dataList = ref<DataSla[]>([]);
const stats = reactive({ total: 0, met: 0, breached: 0, pending: 0 });

const columns = [
  { title: 'SLA名称', dataIndex: 'name', key: 'name' },
  { title: '管道名称', dataIndex: 'pipelineName', key: 'pipelineName' },
  { title: '预期完成时间', dataIndex: 'expectedCompletionTime', key: 'expectedCompletionTime', width: 180 },
  { title: '实际完成时间', dataIndex: 'actualCompletionTime', key: 'actualCompletionTime', width: 180 },
  { title: 'SLA状态', dataIndex: 'slaStatus', key: 'slaStatus', width: 120 },
  { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
];

const slaStatusColorMap: Record<string, string> = { met: 'green', breached: 'red', pending: 'orange' };

const modalVisible = ref(false);
const formState = reactive({
  name: '', pipelineName: '', expectedCompletionTime: '', date: '',
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await getSlaList();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取SLA列表失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    const res = await getSlaStats();
    if (res) {
      stats.total = res.total ?? 0;
      stats.met = res.met ?? 0;
      stats.breached = res.breached ?? 0;
      stats.pending = res.pending ?? 0;
    }
  } catch {
    // stats fetch failure is non-critical
  }
}

function showCreate() {
  Object.assign(formState, { name: '', pipelineName: '', expectedCompletionTime: '', date: '' });
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formState.name || !formState.pipelineName) { message.error('名称和管道名称不能为空'); return; }
  try {
    await createSla({ ...formState });
    message.success('创建成功');
    modalVisible.value = false;
    fetchList();
    fetchStats();
  } catch (e: any) {
    message.error('操作失败: ' + e.message);
  }
}

onMounted(() => { fetchList(); fetchStats(); });
</script>

<template>
  <div class="p-4">
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card><Statistic title="SLA总数" :value="stats.total" /></Card>
      </Col>
      <Col :span="6">
        <Card><Statistic title="已达成" :value="stats.met" :value-style="{ color: '#52c41a' }" /></Card>
      </Col>
      <Col :span="6">
        <Card><Statistic title="已违约" :value="stats.breached" :value-style="{ color: '#ff4d4f' }" /></Card>
      </Col>
      <Col :span="6">
        <Card><Statistic title="待定" :value="stats.pending" :value-style="{ color: '#fa8c16' }" /></Card>
      </Col>
    </Row>
    <Card title="SLA管理">
      <template #extra><Button type="primary" @click="showCreate">新建SLA</Button></template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1000 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'slaStatus'">
            <Tag :color="slaStatusColorMap[(_record as any).slaStatus] || 'default'">{{ (_record as any).slaStatus }}</Tag>
          </template>
        </template>
      </Table>
    </Card>
    <Modal v-model:open="modalVisible" title="新建SLA" @ok="handleSubmit" :destroy-on-close="true" width="600px">
      <Form layout="vertical">
        <FormItem label="SLA名称" required><Input v-model:value="formState.name" /></FormItem>
        <FormItem label="管道名称" required><Input v-model:value="formState.pipelineName" /></FormItem>
        <FormItem label="预期完成时间"><Input v-model:value="formState.expectedCompletionTime" placeholder="HH:mm:ss" /></FormItem>
        <FormItem label="日期"><Input v-model:value="formState.date" placeholder="YYYY-MM-DD" /></FormItem>
      </Form>
    </Modal>
  </div>
</template>
