<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly forbidden to copy, distribute, or use without explicit authorization.
驻场 Agent 工作面板。 Resident Agent work panel.
Author: maoyo | Department: 研发部 | Date: 2026-09-15 | Version: 1.3.0
Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import {
  ArrowRightLeft,
  ArrowUp,
  InspectionPanel,
  Plus,
  RotateCw,
  Settings,
  Square,
} from '@vben/icons';
import { useAccessStore, useUserStore } from '@vben/stores';
import { Drawer } from 'ant-design-vue';
import { isActiveTask, residentRequest, safeDetails } from './resident-api';
import type {
  ResidentConversation,
  ResidentHealth,
  ResidentModel,
  ResidentScope,
  ResidentTask,
} from './resident-api';

const props = defineProps<{
  platform: string;
  scope: ResidentScope;
  enabled: boolean;
}>();
const access = useAccessStore();
const user = useUserStore();
const open = ref(false);
const view = ref<'chat' | 'tasks' | 'model'>('chat');
const health = ref<ResidentHealth | null>(null);
const conversations = ref<ResidentConversation[]>([]);
const selectedConversation = ref<ResidentConversation | null>(null);
const selected = ref<ResidentTask | null>(null);
const draft = ref('');
const error = ref('');
const notice = ref('');
const busy = ref(false);
const loading = ref(false);
const modelLoading = ref(false);
const testResult = ref('');
const modelDraft = reactive({ baseUrl: '', model: '', apiKey: '' });
let generation = 0;
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let controller = new AbortController();
const label: Record<string, string> = {
  QUEUED: '排队中',
  RUNNING: '处理中',
  SUCCEEDED: '已完成',
  FAILED: '失败',
  INTERRUPTED: '已中断',
  PENDING_HANDOFF: '待提交',
  ONLINE: '在线',
  DEGRADED: '需检查',
  OFFLINE: '离线',
};
const platformLabel = computed(
  () =>
    `Xnet${props.platform === 'aiops' ? 'AIOps' : props.platform === 'dataops' ? 'DataOps' : 'MLOps'}`,
);
const tasks = computed(() =>
  conversations.value.flatMap((item) => item.tasks ?? []),
);
const active = computed(() => isActiveTask(selected.value));
// 当前任务的轨迹不能混入其他回合；Keep the selected task trace separate from other turns.
const taskEvents = computed(() => selectedConversation.value?.events.filter(
  (event) => event.taskId === selected.value?.id,
) ?? []);
const configured = computed(() =>
  Boolean(
    health.value?.modelConfigured || health.value?.model?.apiKeyConfigured,
  ),
);
const canConfigure = computed(() => Boolean(health.value?.user?.canConfigure));
const activeCount = computed(() => tasks.value.filter(isActiveTask).length);
const scopeKey = computed(() =>
  [
    access.accessToken,
    props.scope.tenantUid,
    props.scope.deptUid,
    props.scope.teamUid,
    props.enabled,
  ].join('|'),
);

/** 将服务端状态映射为本地标签。 Map server state to a local label. */
function status(value?: string) {
  return value ? (label[value.toUpperCase()] ?? value) : '未连接';
}
/** 格式化时间。 Format an ISO timestamp for display. */
function time(value?: string) {
  return value
    ? new Date(value).toLocaleString('zh-CN', { hour12: false })
    : '';
}
/** 创建带有当前组织范围的请求。 Create a request carrying the current organization scope. */
function request<T>(path: string, method = 'GET', body?: unknown) {
  return residentRequest<T>(
    {
      token: access.accessToken ?? '',
      scope: props.scope,
      userId: user.userInfo?.userId,
    },
    path,
    { method, body, signal: controller.signal },
  );
}
/** 使旧范围的请求和轮询失效。 Invalidate requests and polling from an old scope. */
function invalidate() {
  generation++;
  controller.abort();
  controller = new AbortController();
  clearTimeout(pollTimer);
}
/** 读取服务状态、会话和任务。 Load service status, conversations and tasks. */
async function refresh() {
  if (!open.value || !props.enabled) return;
  const current = generation;
  loading.value = true;
  error.value = '';
  try {
    const nextHealth = await request<ResidentHealth>('/status');
    if (current !== generation) return;
    health.value = nextHealth;
    const summaries = await request<Array<{ id: string }>>('/conversations');
    const nextConversations = await Promise.all(
      summaries.map((item) =>
        request<ResidentConversation>(`/conversations/${item.id}`),
      ),
    );
    if (current !== generation) return;
    conversations.value = nextConversations;
    if (selected.value) await loadTask(selected.value.id);
  } catch (cause) {
    if (current === generation)
      error.value =
        cause instanceof Error ? cause.message : '驻场服务暂时不可用';
  } finally {
    if (current === generation) {
      loading.value = false;
      clearTimeout(pollTimer);
      pollTimer = setTimeout(refresh, 2500);
    }
  }
}
/** 读取任务所在会话并呈现消息、工具轨迹和证据。 Load the task conversation with messages, tool traces and evidence. */
async function loadTask(id: string) {
  const current = generation;
  const task = tasks.value.find((item) => item.id === id) ?? selected.value;
  if (!task?.conversationId) return;
  const detail = await request<ResidentConversation>(
    `/conversations/${task.conversationId}`,
  );
  if (current !== generation) return;
  selectedConversation.value = detail;
  selected.value = detail.tasks.find((item) => item.id === id) ?? task;
}
/** 开始新会话。 Start a new conversation. */
function newTask() {
  selected.value = null;
  selectedConversation.value = null;
  draft.value = '';
  view.value = 'chat';
}
/** 打开既有任务。 Open an existing task. */
async function openTask(task: ResidentTask) {
  selected.value = task;
  view.value = 'chat';
  await loadTask(task.id);
}
/** 提交消息并等待服务端接收。 Submit a message and wait for server acceptance. */
async function submit() {
  if (!draft.value.trim() || busy.value || !configured.value) return;
  busy.value = true;
  error.value = '';
  try {
    let detail = selectedConversation.value;
    if (!detail)
      detail = await request<ResidentConversation>('/conversations', 'POST', {
        title: draft.value.slice(0, 60),
      });
    const result = await request<{
      taskId: string;
      conversationId: string;
      status: string;
    }>(`/conversations/${detail.id}/messages`, 'POST', {
      content: draft.value,
      clientMessageId: crypto.randomUUID(),
    });
    draft.value = '';
    selectedConversation.value = detail;
    selected.value = {
      id: result.taskId,
      conversationId: result.conversationId,
      status: result.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await refresh();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '消息未提交';
  } finally {
    busy.value = false;
  }
}
/** 停止或恢复任务，状态由服务端确认。 Stop or resume a task using server-confirmed state. */
async function taskAction(action: 'stop' | 'resume') {
  if (!selected.value || busy.value) return;
  busy.value = true;
  try {
    selected.value = await request<ResidentTask>(
      `/tasks/${selected.value.id}/${action}`,
      'POST',
      {},
    );
    await refresh();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '任务操作失败';
  } finally {
    busy.value = false;
  }
}
/** 创建真实协同请求；服务端返回待交接时才显示。 Create a real handoff request and show only its server state. */
async function escalate() {
  if (!selectedConversation.value || busy.value) return;
  busy.value = true;
  try {
    await request(
      `/conversations/${selectedConversation.value.id}/escalations`,
      'POST',
      { reason: '需要跨平台协同' },
    );
    notice.value = '协同请求已保存，当前待交接';
    await refresh();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '协同请求未提交';
  } finally {
    busy.value = false;
  }
}
/** 读取不含密钥的模型配置。 Read redacted model configuration. */
async function openModel() {
  view.value = 'model';
  if (!canConfigure.value) return;
  modelLoading.value = true;
  try {
    Object.assign(modelDraft, await request<ResidentModel>('/model'), {
      apiKey: '',
    });
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '模型配置读取失败';
  } finally {
    modelLoading.value = false;
  }
}
/** 保存或测试模型配置，空白密钥表示保留现有值。 Save or test model configuration; a blank key keeps the existing secret. */
async function modelAction(action: 'save' | 'test') {
  if (!canConfigure.value || modelLoading.value) return;
  modelLoading.value = true;
  testResult.value = '';
  const body = {
    baseUrl: modelDraft.baseUrl.trim(),
    model: modelDraft.model.trim(),
    ...(modelDraft.apiKey.trim() ? { apiKey: modelDraft.apiKey.trim() } : {}),
  };
  try {
    if (action === 'save') {
      await request('/model', 'PUT', body);
      modelDraft.apiKey = '';
      notice.value = '模型配置已保存';
      await refresh();
    } else {
      await refresh();
      testResult.value = health.value?.status === 'ONLINE'
        ? '驻场服务在线。模型连接以会话实际返回为准。' : '驻场服务未就绪';
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '模型配置保存失败';
  } finally {
    modelLoading.value = false;
  }
}
/** 清除账号或组织切换后的旧状态。 Clear stale state after account or organization changes. */
function resetScope() {
  invalidate();
  health.value = null;
  conversations.value = [];
  selected.value = null;
  selectedConversation.value = null;
  error.value = '';
  void refresh();
}
/** 切换面板并取消旧请求；Toggle the panel and cancel stale requests. */
function visibilityChanged(value: boolean) {
  if (value) void refresh();
  else invalidate();
}
watch(scopeKey, resetScope);
watch(open, visibilityChanged);
/** 从助手管理页打开现有面板；Open the existing panel from assistant management. */
function showResident() { if (props.enabled) open.value = true; }
onMounted(() => window.addEventListener('synapxnet:open-resident', showResident));
onBeforeUnmount(() => {
  invalidate();
  window.removeEventListener('synapxnet:open-resident', showResident);
});
</script>

<template>
  <button
    class="resident-launch"
    type="button"
    title="驻场 Agent"
    aria-label="打开驻场 Agent"
    :disabled="!enabled"
    @click="open = true"
  >
    <InspectionPanel :size="18" /><span>驻场 Agent</span><span
      v-if="activeCount"
      class="resident-count"
      >{{ activeCount }}</span
    >
  </button>
  <Drawer
    v-model:open="open"
    :width="520"
    :root-style="{ maxWidth: '100vw' }"
    :body-style="{ padding: 0, overflow: 'hidden' }"
    :title="platformLabel + ' 驻场 Agent'"
  >
    <div class="resident-shell">
      <div class="resident-statusline">
        <span>{{ status(health?.status) }}</span
        ><span>{{ health?.model?.model || '模型未配置' }}</span
        ><button
          class="resident-icon"
          type="button"
          title="重新读取"
          aria-label="重新读取"
          @click="refresh"
        >
          <RotateCw :size="15" />
        </button>
      </div>
      <div class="resident-tabbar">
        <button
          type="button"
          :aria-selected="view === 'chat'"
          @click="view = 'chat'"
        >
          对话</button
        ><button
          type="button"
          :aria-selected="view === 'tasks'"
          @click="view = 'tasks'"
        >
          任务 {{ tasks.length }}</button
        ><button
          type="button"
          :aria-selected="view === 'model'"
          @click="openModel"
        >
          <Settings :size="14" />模型</button
        ><button
          class="resident-icon resident-new"
          type="button"
          title="新建任务"
          aria-label="新建任务"
          @click="newTask"
        >
          <Plus :size="17" />
        </button>
      </div>
      <div v-if="error" class="resident-banner resident-error" role="alert">
        {{ error }}<button type="button" @click="refresh">重试</button>
      </div>
      <div v-if="notice" class="resident-banner" role="status">
        {{ notice }}
      </div>
      <template v-if="view === 'chat'"
        ><div class="resident-conversation">
          <div v-if="!selected" class="resident-empty">
            <InspectionPanel :size="27" />
            <h3>{{ platformLabel }} 驻场协作</h3>
            <p v-if="!configured">模型尚未就绪</p>
            <p v-else>当前团队 · {{ scope.teamUid }}</p>
            <button
              v-if="!configured && canConfigure"
              type="button"
              class="resident-command"
              @click="openModel"
            >
              配置模型
            </button>
          </div>
          <template v-else
            ><div class="resident-task-meta">
              <span class="resident-task-state">{{
                status(selected.status)
              }}</span
              ><time>{{ time(selected.createdAt) }}</time>
            </div>
            <section
              v-if="selectedConversation"
              class="resident-message resident-user"
            >
              <div class="resident-message-label">你</div>
              <div>
                {{
                  selectedConversation.messages.find(
                    (item) => item.taskId === selected?.id,
                  )?.content
                }}
              </div>
            </section>
            <details
              v-if="taskEvents.length"
              class="resident-trace"
              :open="active"
            >
              <summary>
                <InspectionPanel :size="14" />任务轨迹
                <span>{{ taskEvents.length }} 条</span>
              </summary>
              <ol>
                <li
                  v-for="event in taskEvents"
                  :key="event.id"
                >
                  <details>
                    <summary>
                      {{ event.type }} <time>{{ time(event.occurredAt) }}</time>
                    </summary>
                    <pre>{{ safeDetails(event) }}</pre>
                  </details>
                </li>
              </ol>
            </details>
            <section
              v-if="
                selectedConversation?.messages.find(
                  (item) =>
                    item.taskId === selected?.id && item.role === 'assistant',
                )
              "
              class="resident-message resident-assistant"
            >
              <div class="resident-message-label">
                <InspectionPanel :size="15" />驻场 Agent
              </div>
              <div>
                {{
                  selectedConversation.messages.find(
                    (item) =>
                      item.taskId === selected?.id && item.role === 'assistant',
                  )?.content
                }}
              </div>
            </section>
            <div v-if="active" class="resident-working">
              {{ status(selected.status) }}
            </div>
            <div
              v-if="selected.errorCode"
              class="resident-task-error"
              role="alert"
            >
              {{ selected.errorCode }}
            </div>
            <div class="resident-message-tools">
              <button
                v-if="active"
                type="button"
                class="resident-command"
                :disabled="busy"
                @click="taskAction('stop')"
              >
                <Square :size="14" />停止</button
              ><button
                v-else-if="['FAILED', 'INTERRUPTED'].includes(selected.status)"
                type="button"
                class="resident-command"
                :disabled="busy"
                @click="taskAction('resume')"
              >
                <RotateCw :size="14" />恢复</button
              ><button
                v-if="health?.handoffAvailable && selectedConversation"
                type="button"
                class="resident-command"
                :disabled="busy"
                @click="escalate"
              >
                <ArrowRightLeft :size="14" />提交协同
              </button>
            </div></template
          >
        </div>
        <form class="resident-composer" @submit.prevent="submit">
          <textarea
            v-model="draft"
            aria-label="驻场 Agent 消息"
            placeholder="输入本平台任务…"
            rows="3"
            maxlength="12000"
            :disabled="!enabled"
          ></textarea>
          <div class="resident-composer-footer">
            <span>只读取证 · {{ health?.source || 'LIVE-STAGING' }}</span
            ><button
              type="submit"
              class="resident-send"
              title="发送任务"
              aria-label="发送任务"
              :disabled="busy || !draft.trim() || !configured"
            >
              <ArrowUp :size="18" />
            </button>
          </div></form
      ></template>
      <section v-else-if="view === 'tasks'" class="resident-task-list">
        <div class="resident-list-heading">
          <span>我的任务</span><span>{{ tasks.length }} 个</span>
        </div>
        <p v-if="!tasks.length" class="resident-empty-text">暂无任务</p>
        <button
          v-for="task in tasks"
          :key="task.id"
          type="button"
          class="resident-task-row"
          @click="openTask(task)"
        >
          <span class="resident-task-state">{{ status(task.status) }}</span
          ><time>{{ time(task.createdAt) }}</time
          ><strong>{{ task.id }}</strong>
        </button>
      </section>
      <section v-else class="resident-model">
        <h3>模型连接</h3>
        <dl>
          <dt>平台</dt>
          <dd>{{ platformLabel }}</dd>
          <dt>当前模型</dt>
          <dd>{{ health?.model?.model || '未配置' }}</dd>
          <dt>API Key</dt>
          <dd>{{ health?.model?.apiKeyConfigured ? '已配置' : '未配置' }}</dd>
        </dl>
        <p v-if="!canConfigure" class="resident-empty-text">
          模型配置由平台管理员维护
        </p>
        <form
          v-else
          class="resident-model-form"
          @submit.prevent="modelAction('save')"
        >
          <label
            >服务地址<input
              v-model="modelDraft.baseUrl"
              type="url"
              required
              autocomplete="off" /></label
          ><label
            >模型名称<input
              v-model="modelDraft.model"
              required
              autocomplete="off" /></label
          ><label
            >API Key<input
              v-model="modelDraft.apiKey"
              type="password"
              placeholder="留空保留现有密钥"
              autocomplete="new-password"
          /></label>
          <div class="resident-model-actions">
            <button
              type="button"
              class="resident-command"
              @click="modelAction('test')"
            >
              <RotateCw :size="14" />检查状态</button
            ><button type="submit" class="resident-save">保存配置</button>
          </div>
          <p v-if="testResult" class="resident-test-result">{{ testResult }}</p>
        </form>
      </section>
    </div>
  </Drawer>
</template>
<style scoped>
.resident-launch,
.resident-icon,
.resident-command,
.resident-tabbar button,
.resident-send,
.resident-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  cursor: pointer;
  font: inherit;
  letter-spacing: 0;
}
.resident-launch {
  position: relative;
  padding: 0 10px;
  white-space: nowrap;
  height: 34px;
  border-radius: 6px;
  color: hsl(var(--foreground));
  background: hsl(var(--primary) / 0.08);
}
.resident-launch:hover,
.resident-icon:hover {
  background: hsl(var(--muted));
  color: hsl(var(--primary));
}
.resident-count {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 15px;
  height: 15px;
  border-radius: 8px;
  background: hsl(var(--primary));
  color: #fff;
  font-size: 10px;
}
.resident-shell {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  font-size: 13px;
}
.resident-statusline,
.resident-tabbar {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 16px;
  border-bottom: 1px solid hsl(var(--border));
  font-size: 12px;
}
.resident-statusline span:nth-child(2) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.resident-tabbar button {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 5px;
  color: hsl(var(--muted-foreground));
  background: transparent;
}
.resident-tabbar button[aria-selected='true'] {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  font-weight: 600;
}
.resident-new {
  margin-left: auto;
  width: 32px;
  padding: 0 !important;
}
.resident-icon {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 5px;
  color: hsl(var(--muted-foreground));
  background: transparent;
}
.resident-banner {
  display: flex;
  gap: 8px;
  margin: 10px 16px 0;
  padding: 10px 12px;
  border-left: 3px solid hsl(var(--primary));
  background: hsl(var(--primary) / 0.06);
  line-height: 1.6;
}
.resident-error {
  border-color: #bc5757;
}
.resident-banner button {
  margin-left: auto;
  background: none;
  border: 0;
  color: inherit;
  text-decoration: underline;
}
.resident-conversation,
.resident-task-list,
.resident-model {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 18px 20px;
}
.resident-empty {
  padding: 50px 0;
}
.resident-empty svg {
  color: hsl(var(--primary));
}
.resident-empty h3 {
  margin: 12px 0 8px;
  font-size: 16px;
}
.resident-empty p,
.resident-empty-text {
  color: hsl(var(--muted-foreground));
  line-height: 1.7;
}
.resident-task-meta,
.resident-row-top,
.resident-list-heading {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: hsl(var(--muted-foreground));
  font-size: 11px;
}
.resident-task-state {
  color: hsl(var(--primary));
  white-space: nowrap;
}
.resident-message {
  margin-top: 18px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.resident-user {
  padding: 12px;
  border-radius: 6px;
  background: hsl(var(--muted) / 0.6);
}
.resident-message-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  margin-bottom: 6px;
}
.resident-assistant .resident-message-label {
  color: hsl(var(--primary));
}
.resident-trace {
  margin-top: 16px;
  border-block: 1px solid hsl(var(--border));
  padding: 9px 0;
}
.resident-trace summary {
  cursor: pointer;
}
.resident-trace ol {
  padding-left: 20px;
}
.resident-trace pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: hsl(var(--muted) / 0.5);
  padding: 8px;
  font-size: 11px;
}
.resident-working {
  padding: 18px 0;
  color: hsl(var(--muted-foreground));
}
.resident-task-error {
  margin-top: 12px;
  padding: 10px;
  border-left: 3px solid #bc5757;
}
.resident-message-tools {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
.resident-command {
  padding: 6px 9px;
  background: transparent;
  color: hsl(var(--primary));
  border-radius: 4px;
  font-size: 12px;
}
.resident-composer {
  flex: none;
  margin: 8px 12px 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--card));
}
.resident-composer textarea {
  display: block;
  width: 100%;
  resize: vertical;
  border: 0;
  outline: 0;
  padding: 12px;
  background: transparent;
  color: inherit;
  font: inherit;
}
.resident-composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  color: hsl(var(--muted-foreground));
  font-size: 11px;
}
.resident-send {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: hsl(var(--primary));
  color: #fff;
}
.resident-task-row {
  display: block;
  width: 100%;
  padding: 14px 8px;
  text-align: left;
  border: 0;
  border-bottom: 1px solid hsl(var(--border));
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.resident-task-row:hover {
  background: hsl(var(--primary) / 0.06);
}
.resident-task-row strong {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.resident-model dl {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 12px;
  margin: 20px 0;
}
.resident-model dt {
  color: hsl(var(--muted-foreground));
}
.resident-model dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.resident-model-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 18px 0;
  font-size: 12px;
}
.resident-model-form input {
  padding: 9px;
  border: 1px solid hsl(var(--border));
  border-radius: 5px;
  background: hsl(var(--card));
  color: inherit;
}
.resident-model-actions {
  display: flex;
  justify-content: space-between;
}
.resident-save {
  padding: 8px 14px;
  border-radius: 5px;
  background: hsl(var(--primary));
  color: #fff;
}
.resident-test-result {
  color: hsl(var(--muted-foreground));
}
.resident-shell button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
@media (max-width: 560px) {
  .resident-conversation,
  .resident-task-list,
  .resident-model {
    padding-inline: 16px;
  }
}
</style>
