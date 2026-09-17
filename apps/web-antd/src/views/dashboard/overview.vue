<script lang="ts" setup>
import DataPage from '#/components/data-page/index.vue';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@vben/stores';

import {
  ApartmentOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  ApiOutlined,
  AuditOutlined,
  CodeOutlined,
  DatabaseOutlined,
  EyeInvisibleOutlined,
  GoldOutlined,
  MonitorOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue';
import { Button, Card, Progress, Statistic, Table, Tag } from 'ant-design-vue';

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
  tskRequestClient,
} from '#/api/request';

const router = useRouter();
const userStore = useUserStore();

/** 判断当前用户的管理权限，仅向管理员展示系统入口。 Check current management permission and show the system entry only to administrators. */
const isAdministrator = computed(() =>
  (userStore.userInfo?.roles ?? []).some(
    (role) => role.toUpperCase() === 'ADMIN',
  ),
);

const stats = ref([
  {
    title: '数据源',
    value: undefined as number | undefined,
    icon: DatabaseOutlined,
    path: '/DSM/datasource/list',
    key: 'dsm',
  },
  {
    title: '同步任务',
    value: undefined as number | undefined,
    icon: SwapOutlined,
    path: '/DIM/task/list',
    key: 'dim',
  },
  {
    title: 'SQL脚本',
    value: undefined as number | undefined,
    icon: CodeOutlined,
    path: '/DDV/script/list',
    key: 'ddv',
  },
  {
    title: '工作流',
    value: undefined as number | undefined,
    icon: ScheduleOutlined,
    path: '/TSK/workflow/list',
    key: 'tsk',
  },
  {
    title: '质量规则',
    value: undefined as number | undefined,
    icon: SafetyCertificateOutlined,
    path: '/DQM/rule/list',
    key: 'dqm',
  },
  {
    title: '元数据表',
    value: undefined as number | undefined,
    icon: ApartmentOutlined,
    path: '/DGV/catalog/list',
    key: 'dgv',
  },
  {
    title: '数据资产',
    value: undefined as number | undefined,
    icon: GoldOutlined,
    path: '/DAS/asset/list',
    key: 'das',
  },
  {
    title: '数据API',
    value: undefined as number | undefined,
    icon: ApiOutlined,
    path: '/DAP/config/list',
    key: 'dap',
  },
  {
    title: '脱敏规则',
    value: undefined as number | undefined,
    icon: EyeInvisibleOutlined,
    path: '/DMS/rule/list',
    key: 'dms',
  },
  {
    title: '监控项',
    value: undefined as number | undefined,
    icon: MonitorOutlined,
    path: '/DOB/monitor/list',
    key: 'dob',
  },
  {
    title: '审计日志',
    value: undefined as number | undefined,
    icon: AuditOutlined,
    path: '/DAU/log/list',
    key: 'dau',
  },
]);

const health = ref<Array<{ title: string; value: number | null }>>([
  { title: '数据源可用', value: null },
  { title: '同步任务上线', value: null },
  { title: '质量通过率', value: null },
  { title: 'SLA达标率', value: null },
]);
/** 按真实记录计算百分比，没有记录时保持未知。 Calculate a percentage from actual records while keeping empty sources unknown. */
function fraction(rows: any[], test: (row: any) => boolean) {
  return rows.length
    ? Math.round((rows.filter(test).length / rows.length) * 100)
    : null;
}
/** 从质量报告与SLA记录读取健康证据。 Read health evidence from quality reports and SLA records. */
async function loadHealth() {
  const [reports, slas] = await Promise.allSettled([
    dqmRequestClient.get('/reports'),
    dobRequestClient.get('/slas'),
  ]);
  if (reports.status === 'fulfilled' && Array.isArray(reports.value)) {
    const rows = reports.value.filter(
      (report) =>
        typeof report.totalRows === 'number' &&
        report.totalRows > 0 &&
        typeof report.failedRows === 'number',
    );
    const total = rows.reduce((sum, row) => sum + row.totalRows, 0),
      failed = rows.reduce((sum, row) => sum + row.failedRows, 0);
    health.value[2]!.value = total
      ? Math.round(((total - failed) / total) * 1000) / 10
      : null;
  }
  if (slas.status === 'fulfilled' && Array.isArray(slas.value))
    health.value[3]!.value = fraction(
      slas.value,
      (row) => row.slaStatus === 'met',
    );
}
const recentAlerts = ref<any[]>([]);
const recentHistory = ref<any[]>([]);

const alertColumns = [
  { title: '告警级别', dataIndex: 'alertLevel', key: 'alertLevel', width: 90 },
  { title: '消息', dataIndex: 'message', key: 'message', ellipsis: true },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  {
    title: '触发时间',
    dataIndex: 'triggeredAt',
    key: 'triggeredAt',
    width: 160,
  },
];

const historyColumns = [
  { title: 'SQL', dataIndex: 'sqlContent', key: 'sqlContent', ellipsis: true },
  {
    title: '状态',
    dataIndex: 'executeStatus',
    key: 'executeStatus',
    width: 80,
  },
  { title: '耗时(ms)', dataIndex: 'durationMs', key: 'durationMs', width: 90 },
  { title: '时间', dataIndex: 'executedAt', key: 'executedAt', width: 160 },
];

const statusColorMap: Record<string, string> = {
  success: 'green',
  running: 'blue',
  failed: 'red',
  pending: 'orange',
  open: 'red',
  acknowledged: 'orange',
  resolved: 'green',
  manual: 'blue',
  scheduled: 'cyan',
  critical: 'red',
  warning: 'orange',
  info: 'blue',
};

/** 载入页面统计资料。 Load statistics displayed on the page. */
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
  ]);

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      stats.value[index]!.value = result.value.length;
      if (index === 0)
        health.value[0]!.value = fraction(
          result.value,
          (row) => row.status === 'active',
        );
      if (index === 1)
        health.value[1]!.value = fraction(
          result.value,
          (row) => row.status === 'online',
        );
    }
  });
}

/** 载入近期质量告警与查询历史。 Load recent quality alerts and query history. */
async function fetchRecentData() {
  try {
    const alerts = await dqmRequestClient.get('/alerts');
    if (Array.isArray(alerts)) {
      recentAlerts.value = alerts.slice(0, 5);
    }
  } catch {
    // 公共请求态展示不可用；不将错误计为零。 Shared request state exposes unavailability without reporting zero.
  }

  try {
    const history = await ddvRequestClient.get('/history');
    if (Array.isArray(history)) {
      recentHistory.value = history.slice(0, 5);
    }
  } catch {
    // 公共请求态展示不可用；不将错误计为零。 Shared request state exposes unavailability without reporting zero.
  }
}

onMounted(() => {
  fetchStats();
  fetchRecentData();
  loadHealth();
});
</script>

<template>
  <DataPage
    title="数据工作台"
    description="当前组织的数据资源、质量状态与最近活动。"
  >
    <div class="overview-workspace">
      <div class="overview-top">
        <section
          class="overview-directory"
          aria-labelledby="dataops-resource-heading"
        >
          <div class="overview-section-heading">
            <h2 id="dataops-resource-heading">数据资源</h2>
            <span>当前组织</span>
          </div>
          <div class="overview-modules">
            <button
              v-for="item in stats"
              :key="item.key"
              class="overview-module"
              type="button"
              @click="router.push(item.path)"
            >
              <span class="overview-module-icon"
                ><component :is="item.icon"
              /></span>
              <span class="overview-module-name">{{ item.title }}</span>
              <Statistic :value="item.value ?? '—'" />
              <ArrowRightOutlined class="overview-module-arrow" />
            </button>
            <button
              v-if="isAdministrator"
              type="button"
              class="overview-module"
              @click="router.push('/USR/user/list')"
            >
              <span class="overview-module-icon"><SettingOutlined /></span>
              <span class="overview-module-name">用户管理</span>
              <span class="overview-module-admin">管理</span>
              <ArrowRightOutlined class="overview-module-arrow" />
            </button>
          </div>
        </section>
        <section
          class="overview-health"
          aria-labelledby="dataops-health-heading"
        >
          <div class="overview-section-heading">
            <h2 id="dataops-health-heading">数据状态</h2>
            <span>按现有记录统计</span>
          </div>
          <div class="health-list">
            <div v-for="item in health" :key="item.title" class="health-item">
              <div class="health-label">
                <span>{{ item.title }}</span
                ><strong>{{
                  item.value === null ? '—' : `${item.value}%`
                }}</strong>
              </div>
              <Progress
                v-if="item.value !== null"
                :percent="item.value"
                :show-info="false"
                stroke-color="hsl(var(--primary))"
                size="small"
              />
              <div v-else class="health-empty"><span>暂无可计算记录</span></div>
            </div>
          </div>
        </section>
      </div>
      <div class="overview-activity">
        <Card title="质量告警" size="small">
          <template #extra
            ><Button type="link" @click="router.push('/DQM/alert/list')"
              >全部告警 <ArrowRightOutlined /></Button
          ></template>
          <Table
            :scroll="{ x: 'max-content' }"
            :columns="alertColumns"
            :data-source="recentAlerts"
            row-key="id"
            size="small"
            :pagination="false"
            :locale="{ emptyText: '当前没有质量告警' }"
          >
            <template #bodyCell="{ column, record: _record }">
              <template v-if="column.key === 'alertLevel'">
                <Tag
                  :color="
                    statusColorMap[(_record as any).alertLevel] || 'default'
                  "
                  >{{ (_record as any).alertLevel }}</Tag
                >
              </template>
              <template v-if="column.key === 'status'">
                <Tag
                  :color="statusColorMap[(_record as any).status] || 'default'"
                  >{{ (_record as any).status }}</Tag
                >
              </template>
            </template>
          </Table>
        </Card>
        <Card title="最近查询" size="small">
          <template #extra
            ><Button type="link" @click="router.push('/DDV/history')"
              >查询历史 <ArrowRightOutlined /></Button
          ></template>
          <Table
            :scroll="{ x: 'max-content' }"
            :columns="historyColumns"
            :data-source="recentHistory"
            row-key="id"
            size="small"
            :pagination="false"
            :locale="{ emptyText: '当前没有查询记录' }"
          >
            <template #bodyCell="{ column, record: _record }">
              <template v-if="column.key === 'executeStatus'">
                <Tag
                  :color="
                    (_record as any).executeStatus === 'success'
                      ? 'green'
                      : 'red'
                  "
                  >{{ (_record as any).executeStatus }}</Tag
                >
              </template>
            </template>
          </Table>
        </Card>
      </div>
    </div>
  </DataPage>
</template>

<style scoped>
.overview-workspace {
  display: grid;
  gap: 18px;
}
.overview-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 18px;
}
.overview-directory,
.overview-health {
  min-width: 0;
  border: 1px solid hsl(var(--border) / 0.8);
  border-radius: var(--dataops-radius);
  background: hsl(var(--card));
}
.overview-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 18px 13px;
  border-bottom: 1px solid hsl(var(--border) / 0.7);
}
.overview-section-heading h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
}
.overview-section-heading > span {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
.overview-modules {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 8px;
}
.overview-module {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  min-height: 60px;
  padding: 10px;
  color: hsl(var(--foreground));
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: calc(var(--dataops-radius) * 0.65);
  cursor: pointer;
}
.overview-module:hover,
.overview-module:focus-visible {
  background: hsl(var(--primary) / 0.07);
}
.overview-module:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: -2px;
}
.overview-module-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.08);
  border-radius: calc(var(--dataops-radius) * 0.55);
  font-size: 16px;
}
.overview-module-name {
  flex: 1;
  font-size: 13px;
  font-weight: 550;
  white-space: nowrap;
}
.overview-module :deep(.ant-statistic-content) {
  font-size: 17px;
  color: hsl(var(--foreground));
}
.overview-module-arrow {
  display: none;
  color: hsl(var(--primary));
  font-size: 12px;
}
.overview-module-admin {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
.health-list {
  display: grid;
  padding: 6px 18px 10px;
}
.health-item {
  padding: 11px 0;
}
.health-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}
.health-label strong {
  font-variant-numeric: tabular-nums;
  font-size: 14px;
  font-weight: 600;
}
.health-empty {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  border-top: 4px solid hsl(var(--muted));
  margin-top: 8px;
  padding-top: 3px;
}
.health-item :deep(.ant-progress) {
  margin-bottom: 0;
}
.overview-activity {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.overview-activity > .ant-card {
  min-width: 0;
}
.overview-activity :deep(.ant-card-body) {
  padding: 0;
  min-height: 218px;
}
.overview-activity :deep(.ant-card-head) {
  padding-inline: 16px;
}
.overview-activity :deep(.ant-btn-link) {
  padding-inline: 0;
  font-size: 12px;
}
@media (max-width: 1100px) {
  .overview-top {
    grid-template-columns: minmax(0, 1fr) 240px;
  }
  .overview-modules {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .overview-module {
    min-height: 50px;
  }
  .overview-activity {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .overview-top {
    grid-template-columns: 1fr;
  }
  .health-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 22px;
  }
}
@media (max-width: 480px) {
  .overview-module {
    gap: 7px;
    padding: 8px;
  }
  .overview-module-icon {
    width: 28px;
    height: 28px;
  }
  .overview-section-heading {
    padding-inline: 14px;
  }
  .health-list {
    padding-inline: 14px;
  }
}
</style>
