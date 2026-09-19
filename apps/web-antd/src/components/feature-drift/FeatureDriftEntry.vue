<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
真实跨域执行证据入口 / Entry into real cross-platform execution evidence.
Author: maoyo | Department: 研发部 | Date: 2026-09-18 | Version: 1.3.0
Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
-->
<script setup lang="ts">
defineProps<{ label?: string }>();
</script>

<template>
  <RouterLink class="drift-entry" to="/AGENT/feature-drift">
    <span class="drift-entry-symbol" aria-hidden="true">↗</span>
    <span class="drift-entry-copy">
      <strong>{{ label || '跨域特征漂移恢复' }}</strong>
      <span>查看同一事件的数据回填、训练产物与独立采样</span>
    </span>
    <span class="drift-entry-caption">隔离 Staging · 执行证据</span>
    <span class="drift-entry-open">打开 →</span>
  </RouterLink>
</template>

<style scoped>
.drift-entry {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 18px;
  padding: 14px 18px;
  border: 1px solid hsl(var(--primary) / 22%);
  border-radius: 12px;
  background: hsl(var(--primary) / 4%);
  color: hsl(var(--foreground));
  text-decoration: none;
  transition:
    background 160ms ease,
    border-color 160ms ease;
}
.drift-entry:hover,
.drift-entry:focus-visible {
  border-color: hsl(var(--primary) / 65%);
  background: hsl(var(--primary) / 8%);
  outline-offset: 3px;
}
.drift-entry-symbol {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: hsl(var(--primary) / 10%);
  color: hsl(var(--primary));
  font-size: 21px;
}
.drift-entry-copy {
  display: grid;
  gap: 3px;
  flex: 1;
}
.drift-entry-copy strong {
  font-size: 14px;
  font-weight: 600;
}
.drift-entry-copy span,
.drift-entry-caption {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
}
.drift-entry-open {
  color: hsl(var(--primary));
  font-size: 13px;
  white-space: nowrap;
}
@media (max-width: 800px) {
  .drift-entry-caption {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .drift-entry {
    transition: none;
  }
}
</style>
