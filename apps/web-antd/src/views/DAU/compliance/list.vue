<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { Card, Table, Tag, Button, Space, Modal, Form, FormItem, Input, Select, DatePicker, message } from 'ant-design-vue';
import { getComplianceReports, createComplianceReport, reviewReport, archiveReport } from '../api/audit';
import type { ComplianceReport } from '../api/types';

const loading = ref(false);
const dataList = ref<ComplianceReport[]>([]);
const modalVisible = ref(false);
const submitLoading = ref(false);

const formState = reactive({
  name: '',
  reportType: undefined as string | undefined,
  periodStart: '',
  periodEnd: '',
});

const reportTypeOptions = [
  { label: 'access', value: 'access' },
  { label: 'change', value: 'change' },
  { label: 'permission', value: 'permission' },
];

const columns = [
  { title: '报告名称', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: '报告类型', dataIndex: 'reportType', key: 'reportType', width: 120 },
  { title: '统计周期', key: 'period', width: 220 },
  { title: '总事件数', dataIndex: 'totalEvents', key: 'totalEvents', width: 100 },
  { title: '风险事件', dataIndex: 'riskEvents', key: 'riskEvents', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 200, fixed: 'right' as const },
];

const reportTypeColorMap: Record<string, string> = {
  access: 'blue',
  change: 'orange',
  permission: 'purple',
};

const statusColorMap: Record<string, string> = {
  generated: 'blue',
  reviewed: 'green',
  archived: 'default',
};

async function fetchList() {
  loading.value = true;
  try {
    const res = await getComplianceReports();
    dataList.value = Array.isArray(res) ? res : [];
  } catch (e: any) {
    message.error('获取合规报告失败: ' + e.message);
  } finally {
    loading.value = false;
  }
}

function handleCreate() {
  formState.name = '';
  formState.reportType = undefined;
  formState.periodStart = '';
  formState.periodEnd = '';
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formState.name || !formState.reportType || !formState.periodStart || !formState.periodEnd) {
    message.warning('请填写完整的报告信息');
    return;
  }
  submitLoading.value = true;
  try {
    await createComplianceReport({
      name: formState.name,
      reportType: formState.reportType,
      periodStart: formState.periodStart,
      periodEnd: formState.periodEnd,
    });
    message.success('报告生成成功');
    modalVisible.value = false;
    fetchList();
  } catch (e: any) {
    message.error('报告生成失败: ' + e.message);
  } finally {
    submitLoading.value = false;
  }
}

async function handleReview(record: ComplianceReport) {
  try {
    await reviewReport(record.id);
    message.success('审核成功');
    fetchList();
  } catch (e: any) {
    message.error('审核失败: ' + e.message);
  }
}

async function handleArchive(record: ComplianceReport) {
  try {
    await archiveReport(record.id);
    message.success('归档成功');
    fetchList();
  } catch (e: any) {
    message.error('归档失败: ' + e.message);
  }
}

function handlePeriodStartChange(_date: any, dateString: string | string[]) {
  formState.periodStart = Array.isArray(dateString) ? dateString[0] || '' : dateString;
}

function handlePeriodEndChange(_date: any, dateString: string | string[]) {
  formState.periodEnd = Array.isArray(dateString) ? dateString[0] || '' : dateString;
}

onMounted(() => { fetchList(); });
</script>

<template>
  <div class="p-4">
    <Card title="合规报告">
      <template #extra>
        <Button type="primary" @click="handleCreate">生成报告</Button>
      </template>
      <Table :columns="columns" :data-source="dataList" :loading="loading" row-key="id" :scroll="{ x: 1100 }">
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'reportType'">
            <Tag :color="reportTypeColorMap[(_record as any).reportType] || 'default'">{{ (_record as any).reportType }}</Tag>
          </template>
          <template v-if="column.key === 'period'">
            {{ (_record as any).periodStart }} ~ {{ (_record as any).periodEnd }}
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ (_record as any).status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small">查看</Button>
              <Button type="link" size="small" @click="handleReview(_record as ComplianceReport)" :disabled="(_record as any).status !== 'generated'">审核</Button>
              <Button type="link" size="small" @click="handleArchive(_record as ComplianceReport)" :disabled="(_record as any).status === 'archived'">归档</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="modalVisible"
      title="生成报告"
      :confirm-loading="submitLoading"
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <FormItem label="报告名称" required>
          <Input v-model:value="formState.name" placeholder="请输入报告名称" />
        </FormItem>
        <FormItem label="报告类型" required>
          <Select
            v-model:value="formState.reportType"
            :options="reportTypeOptions"
            placeholder="请选择报告类型"
          />
        </FormItem>
        <FormItem label="开始日期" required>
          <DatePicker
            style="width: 100%"
            placeholder="请选择开始日期"
            @change="handlePeriodStartChange"
          />
        </FormItem>
        <FormItem label="结束日期" required>
          <DatePicker
            style="width: 100%"
            placeholder="请选择结束日期"
            @change="handlePeriodEndChange"
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
