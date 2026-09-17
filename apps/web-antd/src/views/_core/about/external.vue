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
import { useRoute } from 'vue-router';
import { Button } from 'ant-design-vue';
import { LinkOutlined } from '@ant-design/icons-vue';
import DataPage from '#/components/data-page/index.vue';
const route = useRoute();
const destinations: Record<string, { url: string; description: string }> = {
  '/synapxnet/openxnet': {
    url: 'https://openxnet.synapxnet.com',
    description: '进入 OpenXnet，连接企业 Agent、长期记忆与跨平台协作。',
  },
  '/synapxnet/frontend': {
    url: 'https://github.com/synapxnet/XnetDataops-web',
    description: '查看数据平台的界面源代码、更新与项目文档。',
  },
  '/synapxnet/backend': {
    url: 'https://github.com/synapxnet/XnetDataops',
    description: '查看数据平台的服务实现、接口与部署文档。',
  },
};
const destination = computed(() => destinations[route.path]);
</script>
<template>
  <DataPage :title="String(route.meta.title)" description="SynapXnet 项目资源"
    ><section v-if="destination" class="external-resource">
      <span class="resource-icon"><LinkOutlined /></span>
      <div class="resource-details">
        <p>{{ destination.description }}</p>
        <small>{{ destination.url }}</small>
      </div>
      <Button
        type="primary"
        :href="destination.url"
        target="_blank"
        rel="noopener noreferrer"
        >在新窗口打开</Button
      >
    </section></DataPage
  >
</template>
<style scoped>
.external-resource {
  display: flex;
  align-items: center;
  gap: 18px;
  max-width: 1080px;
  padding: 24px;
  border: 1px solid hsl(var(--border));
  border-radius: var(--dataops-radius);
  background: hsl(var(--card));
}
.resource-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: calc(var(--dataops-radius) * 0.65);
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.1);
  font-size: 20px;
}
.resource-details {
  min-width: 0;
  flex: 1;
}
.external-resource p {
  color: hsl(var(--foreground));
  font-size: 13px;
  line-height: 1.8;
  margin: 0;
}
.external-resource small {
  display: block;
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  margin-top: 6px;
  overflow-wrap: anywhere;
}
@media (max-width: 640px) {
  .external-resource {
    flex-wrap: wrap;
    padding: 18px;
    gap: 14px;
  }
  .resource-details {
    flex-basis: calc(100% - 56px);
  }
}
</style>
