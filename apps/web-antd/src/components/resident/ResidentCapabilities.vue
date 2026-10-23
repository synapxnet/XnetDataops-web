<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
驻场员工能力工作台 / Resident employee capability workbench.
Author: maoyo | Department: 研发部 | Date: 2026-09-19 | Version: 1.3.0
Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
-->
<script setup lang="ts">
import type { Ref } from 'vue';
import type { ResidentScope } from './resident-api';
import type {
  Capabilities,
  KnowledgeCatalog,
  KnowledgeEntry,
  KnowledgeQuery,
  Platform,
  ResidentSkill,
  SkillCatalog,
  WorkbenchHealth,
} from './capability-contract';
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
import { useAccessStore, useUserStore } from '@vben/stores';
import { residentRequest, safeDetails } from './resident-api';
import {
  platformDescriptions,
  platformNames,
  platformTitles,
  stateLabel,
  timeLabel,
} from './capability-contract';

const props = defineProps<{ platform: Platform }>();
const access = useAccessStore();
const user = useUserStore();
const scope = inject<Ref<ResidentScope>>(
  'selectedOrganization',
  ref({ tenantUid: null, deptUid: null, teamUid: null }),
);
const tab = ref<'tools' | 'knowledge' | 'skills'>('knowledge');
const health = ref<WorkbenchHealth | null>(null);
const capabilities = ref<Capabilities | null>(null);
const knowledge = ref<KnowledgeCatalog | null>(null);
const skills = ref<SkillCatalog | null>(null);
const detail = ref<KnowledgeEntry | null>(null);
const selectedSkill = ref<ResidentSkill | null>(null);
const workspace = ref('');
const query = ref('');
const result = ref<KnowledgeQuery | null>(null);
const loading = ref(false);
const querying = ref(false);
const errors = ref<string[]>([]);
const queryError = ref('');
let active = true;
let mounted = false;
let generation = 0;
let queryGeneration = 0;
let controller = new AbortController();
let queryController = new AbortController();
const identityKey = computed(() =>
  [
    access.accessToken,
    props.platform,
    scope.value.tenantUid,
    scope.value.deptUid,
    scope.value.teamUid,
    scope.value.dataAccess,
    user.userInfo?.userId,
  ].join('|'),
);
const displayedKnowledge = computed(
  () => result.value?.results ?? knowledge.value?.entries ?? [],
);
const allowedCount = computed(
  () => capabilities.value?.tools.filter((tool) => tool.available).length ?? 0,
);
const examples: Record<Platform, string[]> = {
  aiops: ['GPU 队列拥塞怎么排查', '服务正常但业务下降', '恢复后如何独立验证'],
  dataops: ['特征血缘怎么追踪', '回填前需要哪些证据', '数据质量与特征漂移'],
  mlops: ['模型输入契约', '特征漂移后如何评估模型', '灰度与回滚条件'],
};

/** 以当前可信登录和组织上下文读取同源接口。 / Request same-origin data with the current login and organization context. */
function request<T>(
  path: string,
  signal: AbortSignal,
  body?: unknown,
): Promise<T> {
  return residentRequest<T>(
    {
      token: access.accessToken ?? '',
      scope: scope.value,
      userId: user.userInfo?.userId,
    },
    path,
    { signal, method: body ? 'POST' : 'GET', body },
  );
}
/** 清除当前页面资料，避免范围变化后残留其他用户内容。 / Clear page data to prevent stale content after scope changes. */
function clearData() {
  health.value = null;
  capabilities.value = null;
  knowledge.value = null;
  skills.value = null;
  detail.value = null;
  selectedSkill.value = null;
  result.value = null;
  errors.value = [];
  queryError.value = '';
}
/** 取消异步读取和检索，使已离开的范围失效。 / Cancel reads and searches and invalidate the departed scope. */
function cancel() {
  generation++;
  queryGeneration++;
  controller.abort();
  queryController.abort();
  loading.value = false;
  querying.value = false;
}
/** 读取真实服务快照，部分接口缺失时分别报告。 / Read real snapshots and report missing endpoints independently. */
async function reload() {
  cancel();
  clearData();
  if (!active || !access.accessToken || scope.value.dataAccess === false)
    return;
  const current = generation;
  controller = new AbortController();
  loading.value = true;
  const suffix =
    '?workspaceId=' + encodeURIComponent(workspace.value || 'personal');
  const paths = [
    '/status',
    '/capabilities' + suffix,
    '/knowledge' + suffix,
    '/skills' + suffix,
  ];
  const names = ['服务状态', '工具能力', '领域知识', 'Skill 目录'];
  const responses = await Promise.allSettled(
    paths.map((path) => request<unknown>(path, controller.signal)),
  );
  if (current !== generation || !active) return;
  for (const [index, response] of responses.entries()) {
    if (response.status === 'rejected') {
      errors.value.push(
        names[index] +
          '：' +
          (response.reason instanceof Error
            ? response.reason.message
            : '未连接'),
      );
      continue;
    }
    const value = response.value as Record<string, unknown> | null;
    if (
      !value ||
      value.platform !== props.platform ||
      (index === 1 && !Array.isArray(value.tools)) ||
      (index > 1 && !Array.isArray(value.entries))
    ) {
      errors.value.push(names[index] + '：响应契约不匹配，请核对服务版本');
      continue;
    }
    if (index === 0) health.value = value as unknown as WorkbenchHealth;
    if (index === 1) capabilities.value = value as unknown as Capabilities;
    if (index === 2) knowledge.value = value as unknown as KnowledgeCatalog;
    if (index === 3) skills.value = value as unknown as SkillCatalog;
  }
  loading.value = false;
}
/** 检索可见资料，迟到结果不能覆盖较新的检索。 / Search visible documents without letting late results overwrite newer queries. */
async function search() {
  if (!query.value.trim() || !knowledge.value || loading.value) return;
  queryController.abort();
  queryController = new AbortController();
  const current = ++queryGeneration;
  const scopeGeneration = generation;
  querying.value = true;
  queryError.value = '';
  result.value = null;
  detail.value = null;
  try {
    const response = await request<KnowledgeQuery>(
      '/knowledge/query',
      queryController.signal,
      {
        query: query.value.trim(),
        limit: 8,
        workspaceId: workspace.value || 'personal',
      },
    );
    if (
      current !== queryGeneration ||
      scopeGeneration !== generation ||
      !active
    )
      return;
    if (
      !Array.isArray(response.results) ||
      (response.platform && response.platform !== props.platform)
    )
      throw new Error('知识检索响应契约不匹配');
    result.value = response;
  } catch (cause) {
    if (current === queryGeneration && scopeGeneration === generation && active)
      queryError.value = cause instanceof Error ? cause.message : '检索失败';
  } finally {
    if (current === queryGeneration && scopeGeneration === generation)
      querying.value = false;
  }
}
/** 使用内置领域问题触发同一个真实检索。 / Run a suggested domain query through the same real search. */
function searchExample(value: string) {
  query.value = value;
  void search();
}
/** 返回目录并取消尚未完成的检索。 / Return to the catalog and cancel a pending query. */
function resetQuery() {
  queryGeneration++;
  queryController.abort();
  querying.value = false;
  query.value = '';
  result.value = null;
  detail.value = null;
  queryError.value = '';
}
/** 打开现有驻场聊天与任务面板。 / Open the existing resident chat and task panel. */
function openChat() {
  window.dispatchEvent(new Event('synapxnet:open-resident'));
}
/** 切换账号与组织后重新获取资料，不复用工作空间。 / Reload after an identity change without reusing a workspace. */
function scopeChanged() {
  workspace.value = '';
  query.value = '';
  if (mounted) void reload();
}
/** 切换工作空间时清空旧检索与详情。 / Clear old searches and details on workspace changes. */
function workspaceChanged() {
  query.value = '';
  void reload();
}
/** 初次挂载时读取资料。 / Fetch data on initial mount. */
function start() {
  mounted = true;
  active = true;
  void reload();
}
/** 页面缓存恢复时重新鉴权读取。 / Reauthenticate when a cached page is restored. */
function activate() {
  if (mounted && !active) {
    active = true;
    void reload();
  }
}
/** 页面隐藏或卸载时释放请求并清除资料。 / Release requests and data when the page is hidden or unmounted. */
function stop() {
  active = false;
  cancel();
  clearData();
}
watch(identityKey, scopeChanged);
watch(workspace, workspaceChanged);
onMounted(start);
onActivated(activate);
onDeactivated(stop);
onBeforeUnmount(stop);
</script>

<template>
  <section class="rc-workbench">
    <header class="rc-header">
      <div class="rc-avatar" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path
            d="M9 13 20 7l11 6v14l-11 6-11-6V13Z M9 13l11 7 11-7 M20 20v13"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <path d="m15 17 5-3 5 3" stroke="currentColor" stroke-width="1.8" />
        </svg>
      </div>
      <div class="rc-title">
        <small>{{ platformNames[platform] }} · 驻场 Agent</small>
        <h1>{{ platformTitles[platform] }}</h1>
        <p>{{ platformDescriptions[platform] }}</p>
      </div>
      <div class="rc-header-actions">
        <button type="button" :disabled="loading" @click="reload">
          {{ loading ? '读取中…' : '重新读取' }}</button
        ><button type="button" class="rc-primary" @click="openChat">
          对话与任务 ↗
        </button>
      </div>
    </header>

    <div class="rc-context">
      <span :class="['rc-state', { connected: health }]">{{
        health ? stateLabel(health.status) : '服务未连接'
      }}</span>
      <span>{{
        health
          ? health.modelConfigured
            ? '模型已配置'
            : '模型未配置'
          : '模型状态未确认'
      }}</span>
      <span>{{ allowedCount ? '具备只读取证权限' : '当前仅查阅与咨询' }}</span>
      <label
        >工作空间
        <select v-model="workspace" :disabled="!health">
          <option value="">平台公共资料</option>
          <option
            v-for="id in health?.workspaceIds ?? []"
            :key="id"
            :value="id"
          >
            {{ id }}
          </option>
        </select></label
      >
    </div>
    <div v-if="errors.length" class="rc-error" role="alert">
      <strong>部分能力暂不可用</strong>
      <p v-for="message in errors" :key="message">{{ message }}</p>
      <small>旧版服务需要同步升级；本页不会用示例数据替代响应。</small>
    </div>
    <div v-if="scope.dataAccess === false" class="rc-empty">
      请选择有数据访问权限的组织。
    </div>

    <div class="rc-overview">
      <div>
        <small>领域知识</small
        ><b
          >{{ knowledge ? knowledge.entries.length : '—'
          }}<span> 条可见资料</span></b
        ><span>{{ knowledge ? stateLabel(knowledge.status) : '待连接' }}</span>
      </div>
      <div>
        <small>Skill 能力</small
        ><b
          >{{ skills ? skills.entries.length : '—' }}<span> 项能力说明</span></b
        ><span>认证与实际可执行状态分别展示</span>
      </div>
      <div>
        <small>工具权限</small
        ><b>{{ capabilities ? allowedCount : '—' }}<span> 项当前可调用</span></b
        ><span>上游健康以本轮调用回执为准</span>
      </div>
      <div>
        <small>知识版本</small
        ><b class="rc-version">{{ knowledge?.packVersion || '—' }}</b
        ><span>本地领域资料 · {{ health?.source || '来源待确认' }}</span>
      </div>
    </div>
    <div class="rc-tabs" role="tablist" aria-label="驻场能力">
      <button
        id="rc-tab-knowledge"
        type="button"
        role="tab"
        :aria-selected="tab === 'knowledge'"
        aria-controls="rc-knowledge"
        @click="tab = 'knowledge'"
      >
        领域知识
      </button>
      <button
        id="rc-tab-skills"
        type="button"
        role="tab"
        :aria-selected="tab === 'skills'"
        aria-controls="rc-skills"
        @click="tab = 'skills'"
      >
        Skill 能力库
      </button>
      <button
        id="rc-tab-tools"
        type="button"
        role="tab"
        :aria-selected="tab === 'tools'"
        aria-controls="rc-tools"
        @click="tab = 'tools'"
      >
        工具与边界
      </button>
    </div>

    <section
      v-if="tab === 'knowledge'"
      id="rc-knowledge"
      role="tabpanel"
      aria-labelledby="rc-tab-knowledge"
      class="rc-panel"
    >
      <form class="rc-search" @submit.prevent="search">
        <label for="rc-search">查询平台知识</label>
        <div>
          <input
            id="rc-search"
            v-model="query"
            maxlength="500"
            placeholder="输入问题、术语或能力名称…"
            :disabled="!knowledge || loading"
          /><button
            class="rc-primary"
            :disabled="!query.trim() || !knowledge || loading || querying"
          >
            {{ querying ? '检索中…' : '检索' }}</button
          ><button v-if="query || result" type="button" @click="resetQuery">
            返回目录
          </button>
        </div>
      </form>
      <div class="rc-examples">
        <button
          v-for="example in examples[platform]"
          :key="example"
          type="button"
          :disabled="!knowledge || loading"
          @click="searchExample(example)"
        >
          {{ example }} ↗
        </button>
      </div>
      <p v-if="queryError" class="rc-error" role="alert">{{ queryError }}</p>
      <p class="rc-caption" role="status">
        {{
          result
            ? '检索结果 · ' + displayedKnowledge.length + ' 条'
            : '平台维护的能力说明与处置方法；当前资源状态需要另行取证。'
        }}
      </p>
      <div class="rc-split">
        <div class="rc-list">
          <button
            v-for="entry in displayedKnowledge"
            :key="entry.id"
            class="rc-row"
            :class="{ selected: detail?.id === entry.id }"
            type="button"
            :aria-pressed="detail?.id === entry.id"
            @click="detail = entry"
          >
            <div>
              <span class="rc-pill">{{ stateLabel(entry.namespace) }}</span
              ><small
                >{{ entry.version || knowledge?.packVersion }} ·
                {{ stateLabel(entry.freshness) }}</small
              >
            </div>
            <h3>{{ entry.title }}</h3>
            <p>{{ entry.summary }}</p>
            <small class="rc-mono">{{ entry.id }}</small>
          </button>
          <div v-if="!displayedKnowledge.length" class="rc-empty">
            {{
              loading
                ? '正在读取资料…'
                : result
                  ? '没有找到相关资料，请调整问题或补充领域文档。'
                  : '暂未取得知识目录。'
            }}
          </div>
        </div>
        <aside class="rc-detail">
          <template v-if="detail"
            ><span class="rc-overline">知识详情</span>
            <h2>{{ detail.title }}</h2>
            <p class="rc-body">
              {{ detail.body || detail.content || detail.summary }}
            </p>
            <small v-if="detail.truncated"
              >检索片段已截断；返回目录可查看完整正文。</small
            >
            <h4>来源</h4>
            <code v-for="source in detail.sourceRefs" :key="source">{{
              source
            }}</code>
            <h4>版本与有效性</h4>
            <p>
              {{ detail.version || knowledge?.packVersion }} ·
              {{ stateLabel(detail.freshness ?? detail.status) }}
            </p>
            <p>有效期：{{ timeLabel(detail.reviewAfter) }}</p>
            <h4>相关工具</h4>
            <code v-for="tool in detail.relatedToolNames" :key="tool">{{
              tool
            }}</code>
            <h4>相关 Skill</h4>
            <code v-for="id in detail.relatedSkillIds" :key="id">{{ id }}</code>
            <details>
              <summary>内容与来源包摘要</summary>
              <pre>{{
                detail.contentDigest ||
                knowledge?.packDigest ||
                '服务未提供摘要'
              }}</pre>
            </details></template
          >
          <div v-else class="rc-detail-empty">
            <span class="rc-book-icon" aria-hidden="true">↗</span>
            <h3>查看员工的工作依据</h3>
            <p>
              选择一条资料，查看来源、正文和适用边界。这里的知识说明不代表实时运行状态。
            </p>
          </div>
        </aside>
      </div>
    </section>

    <section
      v-if="tab === 'skills'"
      id="rc-skills"
      role="tabpanel"
      aria-labelledby="rc-tab-skills"
      class="rc-panel"
    >
      <div class="rc-section-intro">
        <h2>从经验方法到受控能力</h2>
        <p>
          每项 Skill
          明确所需信息、执行边界与验证方式；候选说明不会自动获得执行权。
        </p>
      </div>
      <div class="rc-split">
        <div class="rc-list">
          <button
            v-for="skill in skills?.entries ?? []"
            :key="skill.id"
            class="rc-row"
            :class="{ selected: selectedSkill?.id === skill.id }"
            type="button"
            :aria-pressed="selectedSkill?.id === skill.id"
            @click="selectedSkill = skill"
          >
            <div>
              <span class="rc-pill">{{ stateLabel(skill.status) }}</span
              ><small
                >v{{ skill.version }} ·
                {{ stateLabel(skill.permissionMode) }}</small
              >
            </div>
            <h3>{{ skill.name }}</h3>
            <p>{{ skill.description }}</p>
            <small>{{
              skill.executable
                ? '具备执行资格，仍需逐次授权'
                : '仅参考 · ' +
                  (skill.unavailableReasons.map(stateLabel).join(' / ') ||
                    '认证工件待补齐')
            }}</small>
          </button>
          <div v-if="!skills?.entries.length" class="rc-empty">
            {{ loading ? '正在读取 Skill…' : '暂未取得 Skill 目录。' }}
          </div>
        </div>
        <aside class="rc-detail">
          <template v-if="selectedSkill"
            ><span class="rc-overline">能力契约</span>
            <h2>{{ selectedSkill.name }}</h2>
            <p>{{ selectedSkill.description }}</p>
            <div class="rc-boundary">
              {{
                selectedSkill.executable
                  ? '执行前仍需确认作用域与审批。'
                  : '当前为参考能力；本页不提供执行或启用按钮。'
              }}
            </div>
            <h4>输入要求</h4>
            <code>{{ selectedSkill.inputFields.join(' · ') }}</code>
            <h4>输出交付</h4>
            <code>{{ selectedSkill.outputFields.join(' · ') }}</code>
            <details>
              <summary>查看输入 / 输出 Schema</summary>
              <pre>{{ safeDetails(selectedSkill.inputSchema) }}</pre>
              <pre>{{ safeDetails(selectedSkill.outputSchema) }}</pre>
            </details>
            <h4>处理步骤</h4>
            <ol>
              <li v-for="step in selectedSkill.steps" :key="step">
                {{ step }}
              </li>
            </ol>
            <h4>停止条件</h4>
            <ul>
              <li
                v-for="condition in selectedSkill.stopConditions"
                :key="condition"
              >
                {{ condition }}
              </li>
            </ul>
            <h4>如何验证</h4>
            <ul>
              <li v-for="rule in selectedSkill.verificationRules" :key="rule">
                {{ rule }}
              </li>
            </ul>
            <h4>失败处理</h4>
            <p>{{ selectedSkill.failurePolicy }}</p>
            <h4>认证工件</h4>
            <p>
              {{ stateLabel(selectedSkill.certification.status) }} ·
              {{
                selectedSkill.certification.environment || '尚未绑定认证环境'
              }}
            </p>
            <code
              v-for="refId in selectedSkill.certification.artifactRefs"
              :key="refId"
              >{{ refId }}</code
            >
            <h4>规程来源</h4>
            <code
              v-for="source in selectedSkill.sourceRefs ?? []"
              :key="source"
              >{{ source }}</code
            >
            <h4>允许的工具</h4>
            <code v-for="tool in selectedSkill.allowedToolNames" :key="tool">{{
              tool
            }}</code></template
          >
          <div v-else class="rc-detail-empty">
            <span class="rc-book-icon" aria-hidden="true">◇</span>
            <h3>能力需要可验证的交付</h3>
            <p>选择一个 Skill，查看输入输出、停止条件、验证要求和认证状态。</p>
          </div>
        </aside>
      </div>
    </section>

    <section
      v-if="tab === 'tools'"
      id="rc-tools"
      role="tabpanel"
      aria-labelledby="rc-tab-tools"
      class="rc-panel"
    >
      <div class="rc-section-intro">
        <h2>本平台实际注册的工具</h2>
        <p>
          可调用状态取决于当前身份、服务器授权范围与连接配置；不代表上游服务已通过健康检查。
        </p>
      </div>
      <details
        v-for="tool in capabilities?.tools ?? []"
        :key="tool.name"
        class="rc-tool"
      >
        <summary>
          <div>
            <h3>{{ tool.title }}</h3>
            <code>{{ tool.name }}</code>
          </div>
          <span class="rc-pill">{{
            tool.available ? '当前可调用 · 只读' : '当前不可调用'
          }}</span>
        </summary>
        <p>{{ tool.description }}</p>
        <p v-if="!tool.available">
          {{ tool.unavailableReason || '需要工作空间授权与工具连接配置' }}
        </p>
        <h4>输入约束</h4>
        <pre>{{ safeDetails(tool.inputSchema) || '暂无输入 Schema' }}</pre>
      </details>
      <div v-if="!capabilities?.tools.length" class="rc-empty">
        {{ loading ? '正在读取能力…' : '暂未取得工具能力目录。' }}
      </div>
      <div class="rc-boundary">
        <strong>本地专业判断 → 跨域统一协作</strong>
        <p>
          驻场员工负责本平台取证与建议。跨平台变更需要 AgentTeams
          编排、人工批准和独立验证。
        </p>
        <p>
          协同接线：{{
            stateLabel(health?.handoffStatus)
          }}。待提交记录不等于协同任务已创建。
        </p>
      </div>
    </section>
    <footer class="rc-footer">
      <span>知识说明 ≠ 实时证据 ≠ 执行授权</span
      ><span>状态读取：{{ timeLabel(health?.observedAt) }}</span>
    </footer>
  </section>
</template>

<style scoped>
.rc-workbench {
  padding: 24px 28px;
  color: hsl(var(--foreground));
  max-width: 1560px;
  margin: 0 auto;
}
.rc-workbench button,
.rc-workbench select,
.rc-workbench input {
  font: inherit;
}
.rc-workbench button {
  cursor: pointer;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 8px 13px;
  background: hsl(var(--card));
  color: inherit;
  transition:
    background 0.16s,
    border-color 0.16s;
}
.rc-workbench button:hover:not(:disabled) {
  background: hsl(var(--primary) / 8%);
  border-color: hsl(var(--primary) / 45%);
}
.rc-workbench button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.rc-workbench :focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 3px;
}
.rc-workbench .rc-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: transparent;
}
.rc-workbench .rc-primary:hover:not(:disabled) {
  background: hsl(var(--primary) / 88%);
}
.rc-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.rc-avatar {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  padding: 8px;
  border: 1px solid hsl(var(--primary) / 25%);
  border-radius: 16px;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
}
.rc-title {
  flex: 1;
}
.rc-title small,
.rc-caption,
.rc-footer,
.rc-title p {
  color: hsl(var(--muted-foreground));
}
.rc-title h1 {
  font-size: 24px;
  font-weight: 650;
  margin: 3px 0 5px;
  letter-spacing: -0.03em;
}
.rc-title p {
  margin: 0;
  font-size: 13px;
}
.rc-header-actions {
  display: flex;
  gap: 8px;
}
.rc-context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
.rc-context label {
  margin-left: auto;
}
.rc-context select {
  margin-left: 8px;
  max-width: 250px;
  padding: 6px;
  border-radius: 6px;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  color: hsl(var(--foreground));
}
.rc-state {
  display: inline-flex;
  gap: 7px;
  align-items: center;
}
.rc-state::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.rc-state.connected {
  color: hsl(var(--primary));
}
.rc-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  border-block: 1px solid hsl(var(--border));
  margin: 20px 0 14px;
  padding: 20px 0;
}
.rc-overview > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
  border-right: 1px solid hsl(var(--border));
  padding-right: 15px;
}
.rc-overview > div:last-child {
  border: none;
}
.rc-overview small,
.rc-overview > div > span {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}
.rc-overview b {
  font-size: 27px;
  font-weight: 600;
  line-height: 1.35;
}
.rc-overview b span {
  font-size: 12px;
  font-weight: 400;
}
.rc-overview .rc-version {
  font-size: 23px;
}
.rc-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid hsl(var(--border));
}
.rc-tabs button {
  border: none;
  border-radius: 6px 6px 0 0;
  background: transparent;
  padding: 12px 18px;
  border-bottom: 2px solid transparent;
}
.rc-tabs button[aria-selected='true'] {
  color: hsl(var(--primary));
  border-bottom-color: hsl(var(--primary));
  font-weight: 600;
  background: hsl(var(--primary) / 6%);
}
.rc-panel {
  padding-top: 20px;
}
.rc-search label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}
.rc-search > div {
  display: flex;
  gap: 8px;
}
.rc-search input {
  width: min(620px, 100%);
  min-width: 0;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  color: inherit;
  padding: 10px 13px;
  border-radius: 8px;
}
.rc-search button {
  flex-shrink: 0;
}
.rc-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0 16px;
}
.rc-examples button {
  padding: 5px 9px;
  font-size: 12px;
  border: none;
  background: hsl(var(--muted) / 60%);
  color: hsl(var(--muted-foreground));
}
.rc-caption {
  font-size: 12px;
  margin: 0 0 12px;
}
.rc-split {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(360px, 1.2fr);
  gap: 24px;
  align-items: start;
}
.rc-list {
  display: grid;
  gap: 8px;
}
.rc-workbench .rc-row {
  text-align: left;
  padding: 16px;
  width: 100%;
}
.rc-row > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rc-row h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 10px 0 6px;
}
.rc-row p {
  color: hsl(var(--muted-foreground));
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.7;
}
.rc-row small {
  color: hsl(var(--muted-foreground));
  font-size: 11px;
}
.rc-workbench .rc-row.selected {
  border-color: hsl(var(--primary) / 60%);
  background: hsl(var(--primary) / 7%);
  box-shadow: inset 3px 0 hsl(var(--primary));
}
.rc-pill {
  display: inline-block;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 8%);
  border-radius: 5px;
  padding: 3px 7px;
  font-size: 11px;
}
.rc-detail {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
  padding: 22px;
  min-height: 350px;
  overflow-wrap: anywhere;
}
.rc-overline {
  font-size: 11px;
  color: hsl(var(--primary));
  letter-spacing: 0.08em;
}
.rc-detail h2 {
  font-size: 19px;
  font-weight: 600;
  margin: 8px 0 18px;
}
.rc-workbench h4 {
  font-size: 12px;
  font-weight: 600;
  margin: 20px 0 8px;
}
.rc-detail p,
.rc-detail li {
  font-size: 13px;
  line-height: 1.85;
  color: hsl(var(--muted-foreground));
}
.rc-detail .rc-body {
  white-space: pre-wrap;
  color: hsl(var(--foreground));
}
.rc-detail ul,
.rc-detail ol {
  padding-left: 18px;
}
.rc-detail code {
  display: block;
  margin-top: 5px;
  padding: 4px 0;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}
.rc-detail details {
  margin-top: 20px;
}
.rc-detail-empty {
  text-align: center;
  max-width: 300px;
  margin: 60px auto;
}
.rc-detail-empty h3 {
  font-size: 16px;
  margin: 12px 0;
  font-weight: 500;
}
.rc-book-icon {
  display: inline-block;
  font-size: 30px;
  color: hsl(var(--primary) / 70%);
}
.rc-section-intro h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 7px;
}
.rc-section-intro p {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
  margin: 0 0 22px;
}
.rc-tool {
  border-bottom: 1px solid hsl(var(--border));
  padding: 16px 0;
}
.rc-tool summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  gap: 12px;
}
.rc-tool summary::after {
  content: '+';
}
.rc-tool[open] summary::after {
  content: '−';
}
.rc-tool summary > div {
  flex: 1;
}
.rc-tool h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 5px;
}
.rc-tool code {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}
.rc-tool p {
  margin: 12px 0;
  font-size: 13px;
}
.rc-workbench pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 11px;
  padding: 14px;
  background: hsl(var(--muted) / 65%);
  border-radius: 7px;
}
.rc-boundary {
  margin: 20px 0 0;
  padding: 14px 16px;
  font-size: 12px;
  background: hsl(var(--primary) / 6%);
  border-left: 2px solid hsl(var(--primary) / 65%);
  border-radius: 0 6px 6px 0;
}
.rc-boundary p {
  margin: 5px 0 0;
  color: hsl(var(--muted-foreground));
}
.rc-empty {
  padding: 50px 20px;
  text-align: center;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
}
.rc-error {
  padding: 12px 16px;
  border: 1px solid hsl(var(--destructive) / 35%);
  border-radius: 8px;
  margin: 16px 0;
  font-size: 12px;
  color: hsl(var(--foreground));
  background: hsl(var(--destructive) / 5%);
}
.rc-error p {
  margin: 5px 0;
}
.rc-error small {
  color: hsl(var(--muted-foreground));
}
.rc-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 22px;
  font-size: 11px;
}
.rc-mono {
  font-family: ui-monospace, Consolas, monospace;
  overflow-wrap: anywhere;
}
@media (max-width: 1000px) {
  .rc-split {
    grid-template-columns: 1fr;
  }
  .rc-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  .rc-overview > div:nth-child(2) {
    border: none;
  }
  .rc-header {
    flex-wrap: wrap;
  }
  .rc-header-actions {
    margin-left: 74px;
  }
  .rc-context label {
    margin-left: 0;
  }
}
@media (max-width: 600px) {
  .rc-workbench {
    padding: 16px;
  }
  .rc-title h1 {
    font-size: 20px;
  }
  .rc-header-actions {
    margin-left: 0;
    width: 100%;
  }
  .rc-context {
    gap: 8px;
  }
  .rc-context label {
    width: 100%;
  }
  .rc-search > div {
    flex-wrap: wrap;
  }
  .rc-search input {
    width: 100%;
  }
  .rc-tabs button {
    padding: 11px;
    font-size: 13px;
  }
  .rc-detail {
    padding: 16px;
  }
  .rc-tool summary {
    flex-wrap: wrap;
  }
  .rc-tool summary > div {
    min-width: 180px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .rc-workbench button {
    transition: none;
  }
}
</style>
