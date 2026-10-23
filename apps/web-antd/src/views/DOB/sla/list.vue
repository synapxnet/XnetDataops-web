<script lang="ts" setup>
const pageRequestState = pageState();
import { pageState } from '#/components/data-page/request-state';
import DataPage from '#/components/data-page/index.vue';
import { ref, onMounted, reactive } from 'vue';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  FormItem,
  Input,
  Statistic,
  Row,
  Col,
  message,
} from 'ant-design-vue';
import { getSlaList, createSla, getSlaStats } from '../api/monitor';
import type { DataSla } from '../api/types';

const loading = ref(false);
const dataList = ref<DataSla[]>([]);
const stats = reactive<{
  total: number | null;
  met: number | null;
  breached: number | null;
  pending: number | null;
}>({ total: null, met: null, breached: null, pending: null });

const columns = [
  { title: 'SLA名称', dataIndex: 'name', key: 'name' },
  { title: '管道名称', dataIndex: 'pipelineName', key: 'pipelineName' },
  {
    title: '预期完成时间',
    dataIndex: 'expectedCompletionTime',
    key: 'expectedCompletionTime',
    width: 180,
  },
  {
    title: '实际完成时间',
    dataIndex: 'actualCompletionTime',
    key: 'actualCompletionTime',
    width: 180,
  },
  { title: 'SLA状态', dataIndex: 'slaStatus', key: 'slaStatus', width: 120 },
  { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
];

const slaStatusColorMap: Record<string, string> = {
  met: 'green',
  breached: 'red',
  pending: 'orange',
};

const modalVisible = ref(false);
const formState = reactive({
  name: '',
  pipelineName: '',
  expectedCompletionTime: '',
  date: '',
});

/** 载入当前条件下的列表并维护加载状态。 Load the list for the current filters and maintain loading state. */
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

/** 载入页面统计资料。 Load statistics displayed on the page. */
async function fetchStats() {
  try {
    const res = await getSlaStats();
    if (res) {
      stats.total = res.total ?? null;
      stats.met = res.met ?? null;
      stats.breached = res.breached ?? null;
      stats.pending = res.pending ?? null;
    }
  } catch {
    // 公共请求态展示不可用，不伪装零。 Shared request state exposes unavailability without inventing zero.
  }
}

/** 初始化新增草稿并打开表单。 Initialize a creation draft and open its form. */
function showCreate() {
  Object.assign(formState, {
    name: '',
    pipelineName: '',
    expectedCompletionTime: '',
    date: '',
  });
  modalVisible.value = true;
}

/** 校验并提交当前表单，失败保留输入。 Validate and submit the current form while retaining input on failure. */
async function handleSubmit() {
  if (!formState.name || !formState.pipelineName) {
    message.error('名称和管道名称不能为空');
    return;
  }
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

onMounted(() => {
  fetchList();
  fetchStats();
});
</script>

<template>
  <DataPage
    description="持续关注数据健康、监控事件与服务目标。"
    title="SLA管理"
  >
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card><Statistic title="SLA总数" :value="stats.total ?? '—'" /></Card>
      </Col>
      <Col :span="6">
        <Card
          ><Statistic
            title="已达成"
            :value="stats.met ?? '—'"
            :value-style="{ color: '#52c41a' }"
        /></Card>
      </Col>
      <Col :span="6">
        <Card
          ><Statistic
            title="已违约"
            :value="stats.breached ?? '—'"
            :value-style="{ color: '#ff4d4f' }"
        /></Card>
      </Col>
      <Col :span="6">
        <Card
          ><Statistic
            title="待定"
            :value="stats.pending ?? '—'"
            :value-style="{ color: '#fa8c16' }"
        /></Card>
      </Col>
    </Row>
    <Card title="SLA管理">
      <template #extra
        ><Button type="primary" @click="showCreate">新建SLA</Button></template
      >
      <Table
        :columns="columns"
        :data-source="dataList"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1000 }"
      >
        <template #bodyCell="{ column, record: _record }">
          <template v-if="column.key === 'slaStatus'">
            <Tag
              :color="
                slaStatusColorMap[(_record as any).slaStatus] || 'default'
              "
              >{{ (_record as any).slaStatus }}</Tag
            >
          </template>
        </template>
      </Table>
    </Card>
    <Modal
      :mask-closable="false"
      :confirm-loading="pageRequestState.writePending > 0"
      v-model:open="modalVisible"
      title="新建SLA"
      @ok="handleSubmit"
      :destroy-on-close="true"
      width="600px"
    >
      <Form
        :disabled="
          pageRequestState.writePending > 0 ||
          Object.keys(pageRequestState.failures).length > 0
        "
        layout="vertical"
      >
        <FormItem label="SLA名称" required
          ><Input v-model:value="formState.name"
        /></FormItem>
        <FormItem label="管道名称" required
          ><Input v-model:value="formState.pipelineName"
        /></FormItem>
        <FormItem label="预期完成时间"
          ><Input
            v-model:value="formState.expectedCompletionTime"
            placeholder="HH:mm:ss"
        /></FormItem>
        <FormItem label="日期"
          ><Input v-model:value="formState.date" placeholder="YYYY-MM-DD"
        /></FormItem>
      </Form>
    </Modal>
  </DataPage>
</template>
