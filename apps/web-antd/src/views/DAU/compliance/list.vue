<script lang="ts" setup>
const pageRequestState = pageState();
import { pageState } from '#/components/data-page/request-state';
import DataPage from '#/components/data-page/index.vue';
import { ref, reactive, onMounted } from 'vue';
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  FormItem,
  Input,
  Select,
  DatePicker,
  Descriptions,
  DescriptionsItem,
  message,
} from 'ant-design-vue';
import {
  getComplianceReports,
  createComplianceReport,
  reviewReport,
  archiveReport,
} from '../api/audit';
import type { ComplianceReport } from '../api/types';

const selectedReport = ref<ComplianceReport | null>(null);
const detailVisible = ref(false);
/** 展示所选真实报告字段，不生成虚构正文。 Show the selected report fields without inventing report content. */
function showDetail(report: ComplianceReport) {
  selectedReport.value = { ...report };
  detailVisible.value = true;
}
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
  {
    title: '总事件数',
    dataIndex: 'totalEvents',
    key: 'totalEvents',
    width: 100,
  },
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

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
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

/** 初始化新增表单并打开面板。 Initialize the creation form and open its panel. */
function handleCreate() {
  formState.name = '';
  formState.reportType = undefined;
  formState.periodStart = '';
  formState.periodEnd = '';
  modalVisible.value = true;
}

/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  if (
    !formState.name ||
    !formState.reportType ||
    !formState.periodStart ||
    !formState.periodEnd
  ) {
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

/** 提交报告审核并刷新列表。 Review the selected report and refresh the list. */
async function handleReview(record: ComplianceReport) {
  try {
    await reviewReport(record.id);
    message.success('审核成功');
    fetchList();
  } catch (e: any) {
    message.error('审核失败: ' + e.message);
  }
}

/** 提交归档请求并刷新列表。 Archive the selected record and refresh the list. */
async function handleArchive(record: ComplianceReport) {
  try {
    await archiveReport(record.id);
    message.success('归档成功');
    fetchList();
  } catch (e: any) {
    message.error('归档失败: ' + e.message);
  }
}

/** 更新报告周期开始日期。 Update the start of the report period. */
function handlePeriodStartChange(_date: any, dateString: string | string[]) {
  formState.periodStart = Array.isArray(dateString)
    ? dateString[0] || ''
    : dateString;
}

/** 更新报告周期结束日期。 Update the end of the report period. */
function handlePeriodEndChange(_date: any, dateString: string | string[]) {
  formState.periodEnd = Array.isArray(dateString)
    ? dateString[0] || ''
    : dateString;
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <DataPage
    description="保留访问和变更轨迹，让合规过程可追溯。"
    title="合规报告"
  >
    <template #extra>
      <Button type="primary" @click="handleCreate">生成报告</Button>
    </template>
    <Table
      :columns="columns"
      :data-source="dataList"
      :loading="loading"
      row-key="id"
      :scroll="{ x: 1100 }"
    >
      <template #bodyCell="{ column, record: _record }">
        <template v-if="column.key === 'reportType'">
          <Tag
            :color="
              reportTypeColorMap[(_record as any).reportType] || 'default'
            "
            >{{ (_record as any).reportType }}</Tag
          >
        </template>
        <template v-if="column.key === 'period'">
          {{ (_record as any).periodStart }} ~ {{ (_record as any).periodEnd }}
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
              @click="showDetail(_record as ComplianceReport)"
              >查看</Button
            >
            <Button
              type="link"
              size="small"
              @click="handleReview(_record as ComplianceReport)"
              :disabled="(_record as any).status !== 'generated'"
              >审核</Button
            >
            <Button
              type="link"
              size="small"
              @click="handleArchive(_record as ComplianceReport)"
              :disabled="(_record as any).status === 'archived'"
              >归档</Button
            >
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      :mask-closable="false"
      v-model:open="modalVisible"
      title="生成报告"
      :confirm-loading="submitLoading"
      @ok="handleSubmit"
    >
      <Form
        :disabled="
          pageRequestState.writePending > 0 ||
          Object.keys(pageRequestState.failures).length > 0
        "
        layout="vertical"
      >
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
    <Modal
      :mask-closable="false"
      :confirm-loading="pageRequestState.writePending > 0"
      v-model:open="detailVisible"
      title="合规报告详情"
      :footer="null"
      width="680"
      ><Descriptions v-if="selectedReport" :column="1" bordered
        ><DescriptionsItem label="报告">{{
          selectedReport.name
        }}</DescriptionsItem
        ><DescriptionsItem label="报告标识">{{
          selectedReport.uid
        }}</DescriptionsItem
        ><DescriptionsItem label="统计周期"
          >{{ selectedReport.periodStart }} 至
          {{ selectedReport.periodEnd }}</DescriptionsItem
        ><DescriptionsItem label="类型 / 状态"
          >{{ selectedReport.reportType }} /
          {{ selectedReport.status }}</DescriptionsItem
        ><DescriptionsItem label="总事件 / 风险事件"
          >{{ selectedReport.totalEvents }} /
          {{ selectedReport.riskEvents }}</DescriptionsItem
        ><DescriptionsItem label="生成者">{{
          selectedReport.generatedBy || '未提供'
        }}</DescriptionsItem
        ><DescriptionsItem label="生成时间">{{
          selectedReport.createdAt
        }}</DescriptionsItem></Descriptions
      ></Modal
    >
  </DataPage>
</template>
