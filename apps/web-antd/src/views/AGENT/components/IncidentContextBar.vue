<script lang="ts" setup>
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { Button, Tag, Tooltip } from 'ant-design-vue';

import type { IncidentContext } from '../api/types';

defineProps<{
  context: IncidentContext;
  loading: boolean;
  severity?: string;
  status?: string;
}>();

const emit = defineEmits<{ refresh: [] }>();

/** 触发当前页面的完整证据刷新。 */
function refreshEvidence() {
  emit('refresh');
}
</script>

<template>
  <header class="context-bar">
    <div class="context-main">
      <div class="context-title">
        <span class="eyebrow">事件</span>
        <strong>{{ context.incidentId }}</strong>
        <Tag v-if="severity" color="error">{{ severity }}</Tag>
        <Tag v-if="status">{{ status }}</Tag>
      </div>
      <dl class="context-meta">
        <div><dt>Workspace</dt><dd>{{ context.workspaceId }}</dd></div>
        <div><dt>Trace</dt><dd>{{ context.traceId }}</dd></div>
      </dl>
    </div>
    <div class="context-actions">
      <Tooltip title="刷新证据">
        <Button :loading="loading" shape="circle" @click="refreshEvidence">
          <template #icon><ReloadOutlined /></template>
        </Button>
      </Tooltip>
      <Button
        :href="`https://openxnet.synapxnet.com/workspaces/${context.workspaceId}/incidents/${context.incidentId}`"
        target="_blank"
      >
        <template #icon><ArrowLeftOutlined /></template>
        返回企业空间
      </Button>
    </div>
  </header>
</template>

<style scoped>
.context-bar {
  align-items: center;
  background: hsl(var(--card));
  border-bottom: 1px solid hsl(var(--border));
  display: flex;
  gap: 24px;
  justify-content: space-between;
  min-height: 76px;
  padding: 14px 20px;
}
.context-main { display: flex; flex: 1; gap: 32px; min-width: 0; }
.context-title { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; min-width: 0; }
.context-title strong { font-size: 16px; overflow-wrap: anywhere; }
.eyebrow { color: hsl(var(--muted-foreground)); font-size: 12px; }
.context-meta { display: flex; gap: 24px; margin: 0; min-width: 0; }
.context-meta div { min-width: 0; }
.context-meta dt { color: hsl(var(--muted-foreground)); font-size: 11px; }
.context-meta dd { font-family: ui-monospace, monospace; font-size: 12px; margin: 3px 0 0; overflow-wrap: anywhere; }
.context-actions { align-items: center; display: flex; flex: none; gap: 8px; }
@media (max-width: 840px) {
  .context-bar, .context-main { align-items: stretch; flex-direction: column; }
  .context-bar { gap: 12px; }
  .context-main { gap: 10px; }
  .context-actions { justify-content: flex-end; }
}
</style>
