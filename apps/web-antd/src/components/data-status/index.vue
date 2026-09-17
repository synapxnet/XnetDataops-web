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
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Space } from 'ant-design-vue';
import { preferences } from '@vben/preferences';
const props = defineProps<{
  status: '403' | '404' | '500' | 'offline' | 'coming-soon';
}>();
const router = useRouter();
const content = computed(
  () =>
    ({
      '403': [
        '当前账号没有访问权限',
        '请检查所选组织，或联系管理员分配此功能的访问权限。',
      ],
      '404': [
        '这里还没有你要找的页面',
        '页面地址可能已经变化，你可以回到数据工作空间继续操作。',
      ],
      '500': ['页面暂时不可用', '服务没有完成当前请求，稍后可重新尝试。'],
      'coming-soon': [
        '功能准备中',
        '此功能尚未在当前版本开放，可返回工作空间继续使用已有能力。',
      ],
      offline: [
        '暂时无法连接服务',
        '检查网络连接后重试，已保存的数据不会因此改变。',
      ],
    })[props.status],
);
/** 重新请求当前地址，不伪造恢复成功。 Reload the current address without claiming recovery in advance. */
function retry() {
  window.location.reload();
}
</script>
<template>
  <section class="data-status">
    <div class="data-status__panel">
      <strong>{{
        status === 'offline'
          ? 'OFFLINE'
          : status === 'coming-soon'
            ? 'SOON'
            : status
      }}</strong>
      <h1>{{ content[0] }}</h1>
      <p>{{ content[1] }}</p>
      <Space wrap
        ><Button
          type="primary"
          @click="router.push(preferences.app.defaultHomePath)"
          >返回工作空间</Button
        ><Button v-if="status === '500' || status === 'offline'" @click="retry"
          >重新尝试</Button
        ><Button v-else @click="router.back()">返回上一页</Button></Space
      >
    </div>
  </section>
</template>
<style scoped>
.data-status {
  display: grid;
  align-content: start;
  min-height: 60dvh;
  padding: 24px;
}
.data-status__panel {
  width: 100%;
  max-width: 880px;
  padding: 28px;
  border: 1px solid hsl(var(--border));
  border-radius: var(--dataops-radius);
  background: hsl(var(--card));
}
.data-status__panel > strong {
  display: inline-block;
  font-size: 13px;
  font-weight: 650;
  line-height: 1.4;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.08);
  border-radius: 5px;
  padding: 5px 8px;
  margin: 0 0 16px;
}
.data-status h1 {
  font-size: 20px;
  font-weight: 650;
  margin-bottom: 12px;
}
.data-status p {
  font-size: 14px;
  line-height: 1.8;
  color: hsl(var(--muted-foreground));
  margin-bottom: 22px;
}
@media (max-width: 480px) {
  .data-status h1 {
    font-size: 18px;
  }
  .data-status__panel {
    padding: 22px;
  }
}
</style>
