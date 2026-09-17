<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：统一业务页面与外观。Purpose: Provide consistent business pages and appearance.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { Alert, Button, Tag, Tooltip } from 'ant-design-vue';
import { currentPageKey, pageState } from './request-state';
const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    area?: string;
    loading?: boolean;
  }>(),
  { title: '', description: '', area: '', loading: false },
);
const route = useRoute();
const ownedPage = currentPageKey();
const state = pageState(ownedPage);
// 只显示当前页面请求的失败原因。 Show only failures owned by this page.
const error = computed(
  () => Object.values(state.failures)[0] || state.writeError,
);
const titles: Record<string, string> = {
  DSM: '数据源',
  DIM: '数据集成',
  DDV: '数据开发',
  TSK: '任务编排',
  DQM: '质量管理',
  DGV: '数据治理',
  DAS: '数据资产',
  DAP: '数据服务',
  DMS: '隐私保护',
  DOB: '数据观测',
  DAU: '审计追踪',
  USR: '系统管理',
  dashboard: '工作空间',
};
const area = computed(
  () => props.area || titles[route.path.split('/')[1] ?? ''] || 'XNET DATAOPS',
);
/** 用户编辑表单时标记草稿，查询筛选不算编辑。 Mark form input as an unsaved edit while excluding plain list filters. */
function markDirty(event: Event) {
  const target = event.target as HTMLElement;
  if (
    currentPageKey() === ownedPage &&
    target.closest('form,.ant-modal') &&
    !target.closest('.dataops-skin-drawer')
  )
    state.dirty = true;
}
/** 重试当前页面读取前确认未保存草稿。 Confirm unsaved edits before refreshing the current page. */
function refresh() {
  if (
    state.dirty &&
    !window.confirm('当前有未保存的内容，刷新会丢弃这些修改。继续刷新？')
  )
    return;
  window.dispatchEvent(new CustomEvent('dataops:refresh-page'));
}
/** 刷新或关闭窗口时提示未保存草稿。 Warn before leaving the browser with an unsaved edit. */
function beforeUnload(event: BeforeUnloadEvent) {
  if (state.dirty) {
    event.preventDefault();
    event.returnValue = '';
  }
}
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload);
  document.addEventListener('input', markDirty, true);
  document.addEventListener('change', markDirty, true);
});
// 导航前保护当前编辑草稿。 Protect the current edit before route navigation.
onBeforeRouteLeave(
  () =>
    !state.dirty ||
    window.confirm('当前有未保存的修改，离开页面会丢弃这些内容。继续离开？'),
);
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload);
  document.removeEventListener('input', markDirty, true);
  document.removeEventListener('change', markDirty, true);
});
</script>
<template>
  <section
    class="data-page"
    :aria-label="area"
    :data-read-failed="Object.keys(state.failures).length > 0"
    @input.capture="markDirty"
    @change.capture="markDirty"
  >
    <header class="data-page__header">
      <div class="data-page__heading">
        <h1>{{ title || route.meta.title }}</h1>
        <Tooltip v-if="description" :title="description">
          <Button
            type="text"
            size="small"
            class="data-page__help"
            aria-label="页面说明"
          >
            <InfoCircleOutlined />
          </Button>
        </Tooltip>
      </div>
      <div class="data-page__actions">
        <Tag v-if="state.dirty" color="processing">未保存修改</Tag
        ><Button :loading="loading || state.pending > 0" @click="refresh"
          ><template #icon><ReloadOutlined /></template>刷新</Button
        ><slot name="extra" /><slot name="actions" />
      </div>
    </header>
    <Alert
      v-if="error"
      class="data-page__error"
      :message="error"
      type="warning"
      show-icon
    />
    <div class="data-page__content"><slot /></div>
  </section>
</template>
