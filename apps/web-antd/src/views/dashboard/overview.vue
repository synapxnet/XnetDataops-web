<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Card, Row, Col, Statistic, Table, Tag, Progress } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import {
  DatabaseOutlined,
  SwapOutlined,
  CodeOutlined,
  ScheduleOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  GoldOutlined,
  ApiOutlined,
  EyeInvisibleOutlined,
  MonitorOutlined,
  AuditOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';
import {
  dapRequestClient,
  dasRequestClient,
  dauRequestClient,
  ddvRequestClient,
  dgvRequestClient,
  dimRequestClient,
  dmsRequestClient,
  dobRequestClient,
  dqmRequestClient,
  dsmRequestClient,
  requestClient,
  tskRequestClient,
} from '#/api/request';

const router = useRouter();

const stats = ref([
  { title: '数据源', value: 0, icon: DatabaseOutlined, color: '#1890ff', path: '/DSM/datasource/list', key: 'dsm' },
  { title: '同步任务', value: 0, icon: SwapOutlined, color: '#52c41a', path: '/DIM/task/list', key: 'dim' },
  { title: 'SQL脚本', value: 0, icon: CodeOutlined, color: '#722ed1', path: '/DDV/script/list', key: 'ddv' },
  { title: '工作流', value: 0, icon: ScheduleOutlined, color: '#fa8c16', path: '/TSK/workflow/list', key: 'tsk' },
  { title: '质量规则', value: 0, icon: SafetyCertificateOutlined, color: '#eb2f96', path: '/DQM/rule/list', key: 'dqm' },
  { title: '元数据表', value: 0, icon: ApartmentOutlined, color: '#13c2c2', path: '/DGV/catalog/list', key: 'dgv' },
  { title: '数据资产', value: 0, icon: GoldOutlined, color: '#faad14', path: '/DAS/asset/list', key: 'das' },
  { title: '数据API', value: 0, icon: ApiOutlined, color: '#2f54eb', path: '/DAP/config/list', key: 'dap' },
  { title: '脱敏规则', value: 0, icon: EyeInvisibleOutlined, color: '#531dab', path: '/DMS/rule/list', key: 'dms' },
  { title: '监控项', value: 0, icon: MonitorOutlined, color: '#08979c', path: '/DOB/monitor/list', key: 'dob' },
  { title: '审计日志', value: 0, icon: AuditOutlined, color: '#d4380d', path: '/DAU/log/list', key: 'dau' },
  { title: '用户数', value: 0, icon: TeamOutlined, color: '#389e0d', path: '/USR/user/list', key: 'usr' },
]);

const recentSyncLogs = ref<any[]>([]);
const recentAlerts = ref<any[]>([]);
const recentWorkflows = ref<any[]>([]);
const recentHistory = ref<any[]>([]);

const syncLogColumns = [
  { title: '任务名', dataIndex: 'taskName', key: 'taskName', ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '读取行', dataIndex: 'rowsRead', key: 'rowsRead', width: 80 },
  { title: '写入行', dataIndex: 'rowsWritten', key: 'rowsWritten', width: 80 },
];

const alertColumns = [
  { title: '告警级别', dataIndex: 'alertLevel', key: 'alertLevel', width: 90 },
  { title: '消息', dataIndex: 'message', key: 'message', ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '触发时间', dataIndex: 'triggeredAt', key: 'triggeredAt', width: 160 },
];

const workflowColumns = [
  { title: '工作流', dataIndex: 'workflowName', key: 'workflowName', ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '触发方式', dataIndex: 'triggerType', key: 'triggerType', width: 90 },
  { title: '开始时间', dataIndex: 'startTime', key: 'startTime', width: 160 },
];

const historyColumns = [
  { title: 'SQL', dataIndex: 'sqlContent', key: 'sqlContent', ellipsis: true },
  { title: '状态', dataIndex: 'executeStatus', key: 'executeStatus', width: 80 },
  { title: '耗时(ms)', dataIndex: 'durationMs', key: 'durationMs', width: 90 },
  { title: '时间', dataIndex: 'executedAt', key: 'executedAt', width: 160 },
];

const statusColorMap: Record<string, string> = {
  success: 'green', running: 'blue', failed: 'red', pending: 'orange',
  open: 'red', acknowledged: 'orange', resolved: 'green',
  manual: 'blue', scheduled: 'cyan',
  critical: 'red', warning: 'orange', info: 'blue',
};

async function fetchStats() {
  const results = await Promise.allSettled([
    dsmRequestClient.get('/datasources'),
    dimRequestClient.get('/tasks'),
    ddvRequestClient.get('/scripts'),
    tskRequestClient.get('/workflows'),
    dqmRequestClient.get('/rules'),
    dgvRequestClient.get('/tables'),
    dasRequestClient.get('/assets'),
    dapRequestClient.get('/configs'),
    dmsRequestClient.get('/rules'),
    dobRequestClient.get('/monitors'),
    dauRequestClient.get('/audit-logs'),
    requestClient.get('/users'),
  ]);

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      stats.value[index]!.value = result.value.length;
    }
  });
}

async function fetchRecentData() {
  try {
    const alerts = await dqmRequestClient.get('/alerts');
    if (Array.isArray(alerts)) {
      recentAlerts.value = alerts.slice(0, 5);
    }
  } catch (_e) { /* ignore */ }

  try {
    const history = await ddvRequestClient.get('/history');
    if (Array.isArray(history)) {
      recentHistory.value = history.slice(0, 5);
    }
  } catch (_e) { /* ignore */ }
}

onMounted(() => {
  fetchStats();
  fetchRecentData();
});
</script>

<template>
  <div class="p-4">
    <Row :gutter="[16, 16]">
      <Col :xs="12" :sm="8" :md="6" :lg="4" :xl="4" v-for="(item, index) in stats" :key="index">
        <Card hoverable size="small" @click="router.push(item.path)" style="cursor: pointer;">
          <Statistic :title="item.title" :value="item.value" :value-style="{ color: item.color, fontSize: '24px' }">
            <template #prefix>
              <component :is="item.icon" :style="{ color: item.color, fontSize: '20px' }" />
            </template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <Row :gutter="[16, 16]" class="mt-4">
      <Col :xs="24" :lg="8">
        <Card title="平台功能模块" size="small">
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <Tag color="blue" style="cursor: pointer;" @click="router.push('/DSM/datasource/list')">数据源管理</Tag>
            <Tag color="green" style="cursor: pointer;" @click="router.push('/DIM/task/list')">数据集成</Tag>
            <Tag color="purple" style="cursor: pointer;" @click="router.push('/DDV/script/list')">数据开发</Tag>
            <Tag color="orange" style="cursor: pointer;" @click="router.push('/TSK/workflow/list')">任务调度</Tag>
            <Tag color="magenta" style="cursor: pointer;" @click="router.push('/DQM/rule/list')">数据质量</Tag>
            <Tag color="cyan" style="cursor: pointer;" @click="router.push('/DGV/catalog/list')">数据治理</Tag>
            <Tag color="gold" style="cursor: pointer;" @click="router.push('/DAS/asset/list')">数据资产</Tag>
            <Tag color="geekblue" style="cursor: pointer;" @click="router.push('/DAP/config/list')">数据API</Tag>
            <Tag color="volcano" style="cursor: pointer;" @click="router.push('/DMS/rule/list')">数据脱敏</Tag>
            <Tag color="lime" style="cursor: pointer;" @click="router.push('/DOB/monitor/list')">数据可观测</Tag>
            <Tag color="red" style="cursor: pointer;" @click="router.push('/DAU/log/list')">数据审计</Tag>
            <Tag style="cursor: pointer;" @click="router.push('/USR/user/list')">用户管理</Tag>
          </div>
        </Card>
      </Col>
      <Col :xs="24" :lg="16">
        <Card title="数据管道健康度" size="small">
          <Row :gutter="16">
            <Col :span="6">
              <div style="text-align: center;">
                <Progress type="circle" :percent="95" :stroke-color="'#52c41a'" :size="80" />
                <div class="text-muted-foreground mt-2">数据源可用</div>
              </div>
            </Col>
            <Col :span="6">
              <div style="text-align: center;">
                <Progress type="circle" :percent="88" :stroke-color="'#1890ff'" :size="80" />
                <div class="text-muted-foreground mt-2">同步成功率</div>
              </div>
            </Col>
            <Col :span="6">
              <div style="text-align: center;">
                <Progress type="circle" :percent="92" :stroke-color="'#722ed1'" :size="80" />
                <div class="text-muted-foreground mt-2">质量通过率</div>
              </div>
            </Col>
            <Col :span="6">
              <div style="text-align: center;">
                <Progress type="circle" :percent="97" :stroke-color="'#faad14'" :size="80" />
                <div class="text-muted-foreground mt-2">SLA达标率</div>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <Row :gutter="[16, 16]" class="mt-4">
      <Col :xs="24" :lg="12">
        <Card title="质量告警" size="small">
          <template v-if="recentAlerts.length > 0">
            <Table :columns="alertColumns" :data-source="recentAlerts" row-key="id" size="small" :pagination="false">
              <template #bodyCell="{ column, record: _record }">
                <template v-if="column.key === 'alertLevel'">
                  <Tag :color="statusColorMap[(_record as any).alertLevel] || 'default'">{{ (_record as any).alertLevel }}</Tag>
                </template>
                <template v-if="column.key === 'status'">
                  <Tag :color="statusColorMap[(_record as any).status] || 'default'">{{ (_record as any).status }}</Tag>
                </template>
              </template>
            </Table>
          </template>
          <template v-else>
            <p class="text-muted-foreground py-[30px] text-center">暂无告警</p>
          </template>
        </Card>
      </Col>
      <Col :xs="24" :lg="12">
        <Card title="最近查询历史" size="small">
          <template v-if="recentHistory.length > 0">
            <Table :columns="historyColumns" :data-source="recentHistory" row-key="id" size="small" :pagination="false">
              <template #bodyCell="{ column, record: _record }">
                <template v-if="column.key === 'executeStatus'">
                  <Tag :color="(_record as any).executeStatus === 'success' ? 'green' : 'red'">{{ (_record as any).executeStatus }}</Tag>
                </template>
              </template>
            </Table>
          </template>
          <template v-else>
            <p class="text-muted-foreground py-[30px] text-center">暂无数据</p>
          </template>
        </Card>
      </Col>
    </Row>
  </div>
</template>
