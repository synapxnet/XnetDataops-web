<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
跨域恢复真实执行工作区 / Real execution workspace for feature drift recovery.
Author: maoyo | Department: 研发部 | Date: 2026-09-18 | Version: 1.3.0
Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
-->
<script setup lang="ts">
import type { Ref } from 'vue';
import type { ResidentScope } from '#/components/resident/resident-api';
import type { DriftRun, EvidenceObject, Platform } from './model';
import {
  computed,
  inject,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAccessStore, useUserStore } from '@vben/stores';
import {
  residentRequest,
  safeDetails,
} from '#/components/resident/resident-api';
import {
  comparisonMeasurements,
  conclusion,
  field,
  measurements,
  metric,
  object,
  parseRun,
  parseRuns,
  percent,
  records,
  short,
  status,
  time,
} from './model';

defineProps<{ platform: Platform }>();
const route = useRoute();
const router = useRouter();
const access = useAccessStore();
const user = useUserStore();
const organization = inject<Ref<ResidentScope>>(
  'selectedOrganization',
  ref({ tenantUid: null, deptUid: null, teamUid: null }),
);
const runs = ref<DriftRun[]>([]);
const selected = ref<DriftRun | null>(null);
const selectedId = ref('');
const query = ref('');
const error = ref('');
const detailError = ref('');
const loading = ref(false);
const detailLoading = ref(false);
const autoRefresh = ref(false);
const active = ref(true);
let listGeneration = 0;
let detailGeneration = 0;
let controller = new AbortController();
let timer: ReturnType<typeof setTimeout> | undefined;
const titles: Record<Platform, string> = {
  aiops: '跨域恢复 · 独立运行采样',
  dataops: '跨域恢复 · 回填与质量',
  mlops: '跨域恢复 · 训练与发布',
};
const platformNames: Record<Platform, string> = {
  aiops: 'XnetAIOps',
  dataops: 'XnetDataOps',
  mlops: 'XnetMLOps',
};
const nativeRoutes: Record<Platform, string> = {
  aiops: '/AGENT/operations',
  dataops: '/TSK/instance/list',
  mlops: '/MEP/deployment/index',
};

/** 按事件、工作空间或轨迹筛选已授权列表。 Filter authorized records by event, workspace or trace. */
function visibleRuns() {
  const text = query.value.trim().toLowerCase();
  return runs.value.filter((run) =>
    `${run.incidentId} ${run.workspaceId} ${run.traceId ?? ''}`
      .toLowerCase()
      .includes(text),
  );
}
const filtered = computed(visibleRuns);
/** 从当前已验证详情中选择本平台字段。 Select domain fields from the verified current detail. */
function domainObject(
  key: 'dataset' | 'training' | 'deployment' | 'latestProbe',
) {
  return selected.value?.[key] ?? {};
}
const dataset = computed(() => domainObject('dataset')); // 仅派生当前数据证据。 Derive the current data evidence only.
const training = computed(() => domainObject('training')); // 仅派生当前训练证据。 Derive the current training evidence only.
const deployment = computed(() => domainObject('deployment')); // 仅派生当前部署证据。 Derive the current deployment evidence only.
const samples = computed(() => comparisonMeasurements(selected.value)); // 固定基线并对比阶段最新采样。 Keep the baseline and compare the latest samples by stage.
const sampleHistory = computed(() => measurements(selected.value)); // 完整历史可展开，不产生虚拟数据。 Preserve expandable history without generating virtual data.
const trials = computed(() => records(training.value.trials)); // 读取实际试验。 Read actual trials.
const canary = computed(() => object(deployment.value.canary)); // 读取真实灰度窗口。 Read the actual canary window.
/** 生成与账号及组织绑定的读取代次键。 Build a request scope key bound to identity and organization. */
function currentScopeKey() {
  return [
    access.accessToken,
    user.userInfo?.userId,
    organization.value.tenantUid,
    organization.value.deptUid,
    organization.value.teamUid,
  ].join('|');
}
const scopeKey = computed(currentScopeKey);
/** 安全读取查询中的事件标识。 Safely read the event identifier in the URL. */
function queryIncident() {
  return typeof route.query.incidentId === 'string'
    ? route.query.incidentId
    : '';
}
/** 请求既有驻场代理，运行时秘密不会进入浏览器。 Request the resident proxy without exposing runtime secrets to the browser. */
function request(path: string) {
  return residentRequest<unknown>(
    {
      token: access.accessToken ?? '',
      userId: user.userInfo?.userId,
      scope: organization.value,
    },
    `/feature-drift${path}`,
    { signal: controller.signal },
  );
}
/** 以明确消息描述读取失败。 Present an explicit read failure. */
function errorText(cause: unknown) {
  return cause instanceof Error
    ? cause.message
    : '真实执行证据读取失败，请重试';
}
/** 读取授权事件；读取失败立即清除旧证据。 Read authorized events and clear stale evidence on failure. */
async function refresh() {
  if (!active.value || !access.accessToken) return;
  const generation = ++listGeneration;
  const scope = scopeKey.value;
  loading.value = true;
  error.value = '';
  try {
    const result = parseRuns(await request('/runs'));
    if (
      generation !== listGeneration ||
      scope !== scopeKey.value ||
      !active.value
    )
      return;
    runs.value = result;
    const requested = selectedId.value || queryIncident();
    const next = requested
      ? result.find((run) => run.incidentId === requested)
      : result[0];
    if (next) await loadRun(next, false);
    else {
      selected.value = null;
      selectedId.value = '';
      detailError.value = requested
        ? '指定事件不在当前授权列表，请选择已有记录'
        : '';
    }
  } catch (cause) {
    if (generation !== listGeneration || scope !== scopeKey.value) return;
    runs.value = [];
    selected.value = null;
    selectedId.value = '';
    detailGeneration++;
    error.value = errorText(cause);
  } finally {
    if (generation === listGeneration && scope === scopeKey.value) {
      loading.value = false;
      scheduleRefresh();
    }
  }
}
/** 精确读取选中事件，快速切换时丢弃旧响应。 Read the selected event exactly and discard responses after fast switching. */
async function loadRun(run: DriftRun, updateRoute = true) {
  const generation = ++detailGeneration;
  const scope = scopeKey.value;
  const changed = selectedId.value !== run.incidentId;
  selectedId.value = run.incidentId;
  if (changed) selected.value = null;
  detailLoading.value = true;
  detailError.value = '';
  if (updateRoute)
    void router.replace({
      query: { ...route.query, incidentId: run.incidentId },
    });
  try {
    const value = await request(
      `/runs/${encodeURIComponent(run.incidentId)}?workspaceId=${encodeURIComponent(run.workspaceId)}`,
    );
    if (
      generation !== detailGeneration ||
      scope !== scopeKey.value ||
      !active.value
    )
      return;
    selected.value = parseRun(value, run.incidentId, run.workspaceId);
  } catch (cause) {
    if (generation !== detailGeneration || scope !== scopeKey.value) return;
    selected.value = null;
    detailError.value = errorText(cause);
  } finally {
    if (generation === detailGeneration && scope === scopeKey.value)
      detailLoading.value = false;
  }
}
/** 仅在用户开启且页面可见时轮询。 Poll only when explicitly enabled and the page is visible. */
function scheduleRefresh() {
  clearTimeout(timer);
  if (autoRefresh.value && active.value) timer = setTimeout(pollVisible, 5000);
}
/** 后台页暂停请求。 Suspend requests in a background page. */
function pollVisible() {
  if (!document.hidden) void refresh();
  else scheduleRefresh();
}
/** 切换范围清空全部旧结果并取消在途请求。 Clear old results and cancel requests when the scope changes. */
function reset() {
  listGeneration++;
  detailGeneration++;
  controller.abort();
  controller = new AbortController();
  clearTimeout(timer);
  runs.value = [];
  selected.value = null;
  selectedId.value = '';
  error.value = '';
  detailError.value = '';
  loading.value = false;
  detailLoading.value = false;
}
/** 重新加载当前身份范围。 Reload the current identity scope. */
function scopeChanged() {
  reset();
  void refresh();
}
/** 缓存页停用时使响应失效。 Invalidate responses when a cached page is deactivated. */
function pause() {
  active.value = false;
  reset();
}
/** 缓存页恢复时重新读取。 Reload when a cached page is activated. */
function resume() {
  active.value = true;
  if (!loading.value && !runs.value.length) void refresh();
}
/** 显示明确的布尔状态。 Display explicit boolean states. */
function flag(value: unknown, yes: string, no: string) {
  return value === true ? yes : value === false ? no : '未记录';
}
/** 标注采样阶段，不混淆补偿与恢复。 Label sampling stages without confusing compensation with recovery. */
function stage(value: unknown) {
  const labels: Record<string, string> = {
    baseline: '故障基线',
    mitigated: '备用特征后',
    candidate: '候选模型',
    active: '当前活动模型',
    compensated: '补偿后',
    latest: '最近独立采样',
    canary: '灰度采样',
    fallback: '备用特征后',
  };
  return typeof value === 'string' ? (labels[value] ?? value) : '未记录阶段';
}
/** 输出受限纯文本证据。 Render bounded plain-text evidence. */
function details(value: unknown) {
  return safeDetails(value);
}
/** 为采样记录生成稳定键。 Create a stable key for a measurement. */
function sampleKey(sample: EvidenceObject, index: number) {
  return `${field(sample.measurementId)}-${index}`;
}

watch(scopeKey, scopeChanged);
watch(autoRefresh, scheduleRefresh);
onMounted(refresh);
onActivated(resume);
onDeactivated(pause);
onBeforeUnmount(pause);
</script>

<template>
  <main class="drift-workspace" data-feature-drift-workspace>
    <header class="drift-heading">
      <div>
        <p class="eyebrow">
          {{ platformNames[platform] }} <span>真实执行证据</span>
        </p>
        <h1>{{ titles[platform] }}</h1>
        <p>同一事件，从实际数据、模型产物与预测采样确认每一步变化。</p>
      </div>
      <div class="heading-actions">
        <RouterLink :to="nativeRoutes[platform]">返回工作台</RouterLink
        ><button class="primary-outline" :disabled="loading" @click="refresh">
          {{ loading ? '正在读取…' : '刷新证据' }}
        </button>
      </div>
    </header>
    <div class="source-strip">
      <span class="source-dot" /><strong>合成 Staging 数据 · 隔离环境</strong
      ><span>实际 CSV 回填、CPU 训练、推理与采样；不代表生产收益。</span
      ><label><input v-model="autoRefresh" type="checkbox" />每 5 秒更新</label>
    </div>
    <p v-if="error" class="error-note" role="alert">
      {{ error }} <button @click="refresh">重新读取</button>
    </p>
    <div class="drift-layout">
      <aside class="run-library">
        <div class="library-heading">
          <strong>跨域恢复事件</strong><span>{{ runs.length }} 项</span>
        </div>
        <input
          v-model="query"
          class="run-search"
          placeholder="搜索事件 / 工作空间 / Trace"
          aria-label="搜索跨域恢复事件"
        />
        <div class="run-list">
          <button
            v-for="run in filtered"
            :key="`${run.workspaceId}/${run.incidentId}`"
            :class="['run-row', { selected: selectedId === run.incidentId }]"
            :aria-pressed="selectedId === run.incidentId"
            @click="loadRun(run)"
          >
            <span class="run-row-head"
              ><strong>特征漂移恢复</strong
              ><span v-if="selectedId === run.incidentId" class="selected-mark"
                >✓ 已选</span
              ></span
            >
            <span class="run-status">{{ status(run.phase) }}</span
            ><code :title="run.incidentId">{{ short(run.incidentId) }}</code
            ><small>{{ time(run.updatedAt) }}</small>
          </button>
          <p v-if="!filtered.length && !loading" class="empty">
            {{
              query
                ? '没有匹配记录'
                : '当前授权范围还没有真实执行记录。请在 OpenXnet 发起新的隔离恢复任务。'
            }}
          </p>
          <p v-if="loading && !runs.length" class="empty">
            正在读取真实运行记录…
          </p>
        </div>
        <p class="library-footnote">
          仅显示服务端授权的事件<br />历史治理模拟记录不混入此列表
        </p>
      </aside>
      <section class="run-detail" :aria-busy="detailLoading">
        <p v-if="detailError" class="error-note" role="alert">
          {{ detailError }}
        </p>
        <div v-if="!selected" class="empty detail-empty">
          <span aria-hidden="true">◎</span>
          <h2>{{ detailLoading ? '读取当前事件' : '选择一次恢复事件' }}</h2>
          <p>查看与该事件绑定的来源时间、产物和独立测量。</p>
        </div>
        <template v-else>
          <header class="detail-heading">
            <div>
              <span class="eyebrow"
                >本次执行 · {{ status(selected.phase) }}</span
              >
              <h2>{{ conclusion(selected) }}</h2>
              <p>任务结论以 OpenXnet 的独立验证与治理记录为准。</p>
              <p>来源更新 {{ time(selected.updatedAt) }}</p>
            </div>
            <span class="source-badge">真实执行 / 合成数据</span>
          </header>
          <p
            v-if="selected.failureMode === 'post_release_contract'"
            class="controlled-failure-note"
          >
            受控故障注入：本隔离事件在发布后故意产生输入契约不匹配，用于验证独立检测和补偿保护。
          </p>
          <details class="identity-details">
            <summary>
              事件关联与执行来源 <code>{{ short(selected.incidentId) }}</code>
            </summary>
            <dl>
              <dt>事件</dt>
              <dd>{{ selected.incidentId }}</dd>
              <dt>工作空间</dt>
              <dd>{{ selected.workspaceId }}</dd>
              <dt>Trace</dt>
              <dd>{{ field(selected.traceId) }}</dd>
              <dt>来源</dt>
              <dd>{{ selected.sourceMode }}</dd>
              <dt>创建时间</dt>
              <dd>{{ time(selected.createdAt) }}</dd>
            </dl>
          </details>

          <section v-if="platform === 'dataops'" class="domain-section">
            <div class="section-title">
              <h3>数据回填与质量</h3>
              <span>{{ status(dataset.status) }}</span>
            </div>
            <div class="metric-grid">
              <div>
                <span>输入行数</span
                ><strong>{{ metric(dataset.inputRows) }}</strong>
              </div>
              <div>
                <span>实际输出行数</span
                ><strong>{{ metric(dataset.outputRows) }}</strong>
              </div>
              <div>
                <span>特征维度</span
                ><strong>{{ metric(dataset.featureDimension) }}</strong>
              </div>
              <div>
                <span>质量实测</span
                ><strong>{{ percent(dataset.qualityScore) }}</strong>
              </div>
            </div>
            <div class="facts">
              <span
                >历史范围
                <b>{{ metric(dataset.historyMonths, ' 个月') }}</b></span
              ><span
                >缺失值 <b>{{ metric(dataset.missingValues) }}</b></span
              ><span
                >数据集 <b>{{ field(dataset.datasetUid) }}</b></span
              >
            </div>
            <details class="evidence-details">
              <summary>数据摘要、时间划分与血缘</summary>
              <dl>
                <dt>源数据 SHA256</dt>
                <dd>{{ field(dataset.sourceDigest) }}</dd>
                <dt>回填数据 SHA256</dt>
                <dd>{{ field(dataset.datasetDigest) }}</dd>
              </dl>
              <pre>{{
                details({
                  timeRange: dataset.timeRange,
                  splits: dataset.splits,
                  lineage: dataset.lineage,
                })
              }}</pre>
            </details>
          </section>

          <section v-if="platform === 'mlops'" class="domain-section">
            <div class="section-title">
              <h3>真实模型训练与产物</h3>
              <span>CPU · {{ status(training.status) }}</span>
            </div>
            <div class="metric-grid">
              <div>
                <span>已记录训练试验</span
                ><strong>{{ trials.length || '未记录' }}</strong>
              </div>
              <div>
                <span>训练 / 验证行数</span
                ><strong
                  >{{ metric(training.trainRows) }} /
                  {{ metric(training.validationRows) }}</strong
                >
              </div>
              <div>
                <span>独立持出样本</span
                ><strong>{{ metric(training.heldOutRows) }}</strong>
              </div>
              <div>
                <span>选中算法</span
                ><strong class="text-value">{{
                  field(training.architecture)
                }}</strong>
              </div>
            </div>
            <p class="section-note">
              选模只使用验证集；独立持出集用于恢复验证。
            </p>
            <details class="evidence-details">
              <summary>训练日志与 {{ trials.length }} 次实际试验</summary>
              <p>
                开始 {{ time(training.startedAt) }} · 完成
                {{ time(training.completedAt) }}
              </p>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>算法</th>
                      <th>验证准确率</th>
                      <th>Log loss</th>
                      <th>实际耗时</th>
                      <th>模型摘要</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(trial, index) in trials" :key="index">
                      <td>{{ field(trial.architecture) }}</td>
                      <td>{{ percent(trial.accuracy) }}</td>
                      <td>{{ metric(trial.logLoss, '', 5) }}</td>
                      <td>{{ metric(trial.durationMs, ' ms') }}</td>
                      <td>
                        <details>
                          <summary>{{ short(trial.modelDigest) }}</summary>
                          <code>{{ field(trial.modelDigest) }}</code>
                          <pre>{{ details(trial.parameters) }}</pre>
                        </details>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <pre>{{ details(training.logs) }}</pre>
            </details>
            <details class="evidence-details">
              <summary>当前训练产物与数据摘要</summary>
              <dl>
                <dt>实验</dt>
                <dd>{{ field(training.experimentUid) }}</dd>
                <dt>模型 SHA256</dt>
                <dd>{{ field(training.modelDigest) }}</dd>
                <dt>数据 SHA256</dt>
                <dd>{{ field(training.datasetDigest) }}</dd>
              </dl>
            </details>
          </section>

          <section v-if="platform !== 'dataops'" class="domain-section">
            <div class="section-title">
              <h3>推理路由与活动产物</h3>
              <span>{{ field(deployment.deploymentUid) }}</span>
            </div>
            <div class="metric-grid">
              <div>
                <span>当前 / 基线修订</span
                ><strong
                  >{{ field(deployment.activeRevision) }} /
                  {{ field(deployment.baselineRevision) }}</strong
                >
              </div>
              <div>
                <span>候选流量</span
                ><strong>{{ metric(deployment.trafficPercent, '%') }}</strong>
              </div>
              <div>
                <span>特征输入维度</span
                ><strong>{{ metric(deployment.featureDimension) }}</strong>
              </div>
              <div>
                <span>备用特征</span
                ><strong class="text-value">{{
                  flag(deployment.fallbackFeatureActive, '已启用', '已退出')
                }}</strong>
              </div>
            </div>
            <details class="evidence-details">
              <summary>活动 / 候选模型摘要与灰度证据</summary>
              <dl>
                <dt>活动模型 SHA256</dt>
                <dd>{{ field(deployment.activeModelDigest) }}</dd>
                <dt>候选模型 SHA256</dt>
                <dd>{{ field(deployment.candidateModelDigest) }}</dd>
                <dt>路由版本</dt>
                <dd>{{ field(deployment.routeVersion) }}</dd>
              </dl>
              <p v-if="canary.compressedWindow === true" class="window-note">
                灰度使用压缩演练窗口，以下为真实起止时间与采样数量，不代表持续
                30 分钟生产观测。
              </p>
              <pre>{{ details(deployment.canary) }}</pre>
            </details>
          </section>

          <section class="domain-section">
            <div class="section-title">
              <h3>独立预测采样</h3>
              <span>缺失指标保留「未采集」</span>
            </div>
            <p class="section-note">
              业务通过率为合成风控样本代理指标。延迟仅为模型预测计算时延，不含网络链路，不是生产端到端
              SLO。 请求可能重复使用持出样本；请求次数与唯一样本数分别列出。
            </p>
            <div v-if="samples.length" class="table-wrap">
              <table class="measurement-table">
                <thead>
                  <tr>
                    <th>采样阶段</th>
                    <th>请求 / 唯一样本</th>
                    <th>推理错误率</th>
                    <th>业务通过率</th>
                    <th>预测准确率</th>
                    <th>P95 计算时延</th>
                    <th>业务恢复</th>
                  </tr>
                </thead>
                <tbody>
                  <template
                    v-for="(sample, index) in samples"
                    :key="sampleKey(sample, index)"
                    ><tr>
                      <td>{{ stage(sample.stage) }}</td>
                      <td>
                        {{ metric(sample.sampleCount) }} /
                        {{ metric(sample.uniqueSamples)
                        }}<small
                          v-if="sample.sampleReuse === true"
                          class="sample-reuse"
                          >含重复采样</small
                        >
                      </td>
                      <td>{{ percent(sample.errorRate) }}</td>
                      <td>{{ percent(sample.approvalRate) }}</td>
                      <td>{{ percent(sample.accuracy) }}</td>
                      <td>{{ metric(sample.p95Ms, ' ms') }}</td>
                      <td>
                        {{ flag(sample.businessRecovered, '已恢复', '未恢复') }}
                      </td>
                    </tr>
                    <tr class="measurement-detail-row">
                      <td colspan="7">
                        <details>
                          <summary>
                            采样窗口 {{ time(sample.startedAt) }} →
                            {{ time(sample.completedAt) }} · 查看摘要与路由计数
                          </summary>
                          <pre>{{ details(sample) }}</pre>
                        </details>
                      </td>
                    </tr></template
                  >
                </tbody>
              </table>
            </div>
            <p v-else class="empty">
              此事件尚无独立采样记录，不能判断恢复结果。
            </p>
            <details v-if="sampleHistory.length" class="evidence-details">
              <summary>
                完整采样历史 ·
                {{ sampleHistory.length }} 条（上表按阶段显示最近一次）
              </summary>
              <details
                v-for="(sample, index) in sampleHistory"
                :key="sampleKey(sample, index)"
                class="evidence-details"
              >
                <summary>
                  {{ index + 1 }} · {{ stage(sample.stage) }} ·
                  {{ time(sample.completedAt) }}
                </summary>
                <pre>{{ details(sample) }}</pre>
              </details>
            </details>
          </section>

          <section
            v-if="selected.compensation"
            class="domain-section compensation-section"
          >
            <div class="section-title">
              <h3>失败与补偿</h3>
              <span>补偿成功 ≠ 原修复目标成功</span>
            </div>
            <p>按审批边界恢复旧模型和安全特征路径，保留失败结论及回读证据。</p>
            <details class="evidence-details">
              <summary>补偿结果与前后摘要</summary>
              <pre>{{ details(selected.compensation) }}</pre>
            </details>
          </section>
          <section class="domain-section">
            <div class="section-title">
              <h3>实际操作与审批关联</h3>
              <span>{{ selected.actions.length }} 条账本记录</span>
            </div>
            <div class="action-list">
              <details
                v-for="(action, index) in selected.actions"
                :key="field(action.actionId) + index"
                class="action-row"
              >
                <summary>
                  <span class="action-number">{{ index + 1 }}</span
                  ><strong>{{ status(action.action) }}</strong
                  ><span>{{ status(action.status) }}</span
                  ><time>{{
                    time(action.completedAt || action.startedAt)
                  }}</time>
                </summary>
                <dl>
                  <dt>审批</dt>
                  <dd>{{ field(action.approvalId) }}</dd>
                  <dt>计划摘要</dt>
                  <dd>{{ field(action.planDigest) }}</dd>
                  <dt>资源版本</dt>
                  <dd>
                    {{ field(action.beforeResourceVersion) }} →
                    {{ field(action.afterResourceVersion) }}
                  </dd>
                  <dt>实际开始 / 结束</dt>
                  <dd>
                    {{ time(action.startedAt) }} /
                    {{ time(action.completedAt) }}
                  </dd>
                </dl>
                <pre>{{ details(action) }}</pre>
              </details>
            </div>
          </section>
        </template>
      </section>
    </div>
  </main>
</template>

<style scoped>
.drift-workspace {
  --drift-border: hsl(var(--border));
  --drift-muted: hsl(var(--muted-foreground));
  padding: 24px;
  color: hsl(var(--foreground));
}
.drift-heading {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  margin-bottom: 20px;
}
.eyebrow {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--drift-muted);
  margin: 0 0 8px;
}
.eyebrow span {
  margin-left: 12px;
  letter-spacing: 0;
}
h1 {
  font-size: 25px;
  font-weight: 650;
  margin: 0 0 6px;
  letter-spacing: -0.03em;
}
.drift-heading p:last-child,
.detail-heading p {
  color: var(--drift-muted);
  font-size: 13px;
  margin: 0;
}
.heading-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  white-space: nowrap;
  font-size: 13px;
}
.heading-actions a {
  color: var(--drift-muted);
}
button {
  cursor: pointer;
}
button:disabled {
  opacity: 0.6;
  cursor: wait;
}
button:focus-visible,
a:focus-visible,
summary:focus-visible,
input:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 3px;
}
.primary-outline {
  padding: 9px 15px;
  color: hsl(var(--primary));
  border: 1px solid hsl(var(--primary) / 35%);
  border-radius: 9px;
  background: hsl(var(--primary) / 5%);
}
.source-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 11px 15px;
  border: 1px solid var(--drift-border);
  border-radius: 10px;
  font-size: 12px;
  color: var(--drift-muted);
  margin-bottom: 18px;
  background: hsl(var(--card));
}
.source-strip strong {
  font-weight: 600;
  color: hsl(var(--foreground));
}
.source-strip label {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.source-dot {
  width: 6px;
  height: 6px;
  background: hsl(var(--primary));
  border-radius: 50%;
}
.drift-layout {
  display: grid;
  grid-template-columns: 262px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
.run-library {
  border: 1px solid var(--drift-border);
  border-radius: 13px;
  background: hsl(var(--card));
  overflow: hidden;
  position: sticky;
  top: 16px;
}
.library-heading {
  display: flex;
  justify-content: space-between;
  padding: 17px 16px 12px;
  font-size: 13px;
}
.library-heading span {
  color: var(--drift-muted);
}
.run-search {
  width: calc(100% - 24px);
  margin: 0 12px 12px;
  padding: 9px 10px;
  border: 1px solid var(--drift-border);
  background: transparent;
  border-radius: 8px;
  font-size: 12px;
}
.run-list {
  max-height: 62vh;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 0 8px 8px;
}
.run-row {
  width: 100%;
  display: grid;
  gap: 7px;
  text-align: left;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 13px 11px;
  background: transparent;
  margin-bottom: 5px;
  transition:
    background 140ms ease,
    border-color 140ms ease;
}
.run-row:hover {
  background: hsl(var(--muted) / 60%);
}
.run-row.selected {
  background: hsl(var(--primary) / 8%);
  border-color: hsl(var(--primary) / 40%);
}
.run-row-head {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  font-size: 13px;
}
.selected-mark {
  font-size: 11px;
  color: hsl(var(--primary));
}
.run-status {
  font-size: 12px;
}
.run-row code,
.run-row small {
  font-size: 11px;
  color: var(--drift-muted);
}
.library-footnote {
  padding: 13px 16px;
  color: var(--drift-muted);
  font-size: 11px;
  border-top: 1px solid var(--drift-border);
  line-height: 1.7;
  margin: 0;
}
.run-detail {
  border: 1px solid var(--drift-border);
  border-radius: 13px;
  background: hsl(var(--card));
  min-width: 0;
  overflow: hidden;
}
.detail-heading {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 22px 24px;
  align-items: start;
}
h2 {
  font-size: 19px;
  font-weight: 600;
  margin: 0 0 8px;
  line-height: 1.5;
}
.source-badge {
  padding: 5px 9px;
  border-radius: 6px;
  background: hsl(var(--primary) / 8%);
  color: hsl(var(--primary));
  font-size: 11px;
  white-space: nowrap;
}
.identity-details {
  margin: 0 24px 18px;
  font-size: 12px;
  color: var(--drift-muted);
}
.controlled-failure-note {
  margin: 0 24px 16px;
  padding: 10px 13px;
  border: 1px solid #d9932a55;
  border-radius: 8px;
  color: #ad6a12;
  background: #d9932a0a;
  font-size: 12px;
  line-height: 1.7;
}
summary {
  cursor: pointer;
}
.identity-details summary code {
  margin-left: 12px;
}
dl {
  display: grid;
  grid-template-columns: 142px minmax(0, 1fr);
  gap: 9px 15px;
  margin: 16px 0;
  font-size: 12px;
}
dt {
  color: var(--drift-muted);
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.domain-section {
  border-top: 1px solid var(--drift-border);
  padding: 20px 24px;
}
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
h3 {
  font-size: 14px;
  font-weight: 650;
  margin: 0;
}
.section-title > span {
  color: var(--drift-muted);
  font-size: 11px;
  overflow-wrap: anywhere;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
  margin: 5px 0 18px;
}
.metric-grid > div {
  display: grid;
  gap: 8px;
}
.metric-grid span {
  color: var(--drift-muted);
  font-size: 12px;
}
.metric-grid strong {
  font-weight: 600;
  font-size: 23px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.metric-grid strong.text-value {
  font-size: 17px;
}
.facts {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  color: var(--drift-muted);
  font-size: 12px;
  padding-bottom: 8px;
}
.facts b {
  color: hsl(var(--foreground));
  font-weight: 500;
  padding-left: 6px;
}
.evidence-details {
  margin-top: 12px;
  font-size: 12px;
}
.evidence-details > summary {
  color: hsl(var(--primary));
  padding: 7px 0;
}
.section-note {
  margin: 0 0 14px;
  font-size: 12px;
  color: var(--drift-muted);
  line-height: 1.7;
}
.table-wrap {
  width: 100%;
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
th {
  text-align: left;
  color: var(--drift-muted);
  font-weight: 500;
  background: hsl(var(--muted) / 45%);
  white-space: nowrap;
}
th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--drift-border);
  vertical-align: top;
}
td code {
  overflow-wrap: anywhere;
}
.sample-reuse {
  display: block;
  margin-top: 4px;
  color: var(--drift-muted);
  font-size: 10px;
}
.measurement-table {
  min-width: 670px;
}
.measurement-detail-row td {
  padding: 7px 12px 13px;
  color: var(--drift-muted);
  font-size: 11px;
}
pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: hsl(var(--muted) / 45%);
  padding: 14px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1.7;
  max-height: 400px;
  overflow-y: auto;
  margin-top: 12px;
  color: hsl(var(--foreground));
}
.window-note,
.compensation-section > p {
  color: #b46b0b;
  font-size: 12px;
  line-height: 1.7;
}
.compensation-section {
  border-left: 3px solid #d9932a;
}
.action-row {
  border-bottom: 1px solid var(--drift-border);
  padding: 12px 0;
}
.action-row:last-child {
  border-bottom: 0;
}
.action-row > summary {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}
.action-number {
  display: grid;
  place-items: center;
  background: hsl(var(--muted));
  color: var(--drift-muted);
  width: 24px;
  height: 24px;
  border-radius: 7px;
  font-size: 11px;
}
.action-row strong {
  font-weight: 500;
  flex: 1;
}
.action-row time {
  color: var(--drift-muted);
  font-size: 11px;
}
.empty {
  padding: 22px 15px;
  text-align: center;
  color: var(--drift-muted);
  font-size: 12px;
  line-height: 1.8;
}
.detail-empty {
  min-height: 420px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}
.detail-empty > span {
  font-size: 44px;
  color: hsl(var(--primary) / 50%);
  padding-bottom: 12px;
}
.detail-empty h2 {
  font-size: 17px;
  color: hsl(var(--foreground));
}
.error-note {
  margin: 0 0 16px;
  padding: 13px 16px;
  border-radius: 9px;
  background: hsl(var(--destructive) / 8%);
  color: hsl(var(--destructive));
  font-size: 13px;
}
.error-note button {
  margin-left: 14px;
  text-decoration: underline;
}
@media (max-width: 1100px) {
  .drift-layout {
    grid-template-columns: 230px minmax(0, 1fr);
    gap: 14px;
  }
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .source-badge {
    display: none;
  }
  .action-row time {
    display: none;
  }
}
@media (max-width: 780px) {
  .drift-workspace {
    padding: 16px;
  }
  .drift-heading {
    align-items: start;
    flex-direction: column;
    gap: 14px;
  }
  .drift-layout {
    display: block;
  }
  .run-library {
    position: static;
    margin-bottom: 16px;
  }
  .run-list {
    max-height: 220px;
  }
  .detail-heading,
  .domain-section {
    padding: 18px 16px;
  }
  dl {
    grid-template-columns: 100px minmax(0, 1fr);
  }
  .source-strip label {
    margin-left: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .run-row {
    transition: none;
  }
}
</style>
