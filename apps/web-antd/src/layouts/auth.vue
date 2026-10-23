<script lang="ts" setup>
import { AuthPageLayout, logo } from '@vben/layouts';

import flowPreview from '../assets/dataops-flow.svg';
import { $t } from '#/locales';

const appName = 'XnetDataops';
/** 仅展示管理员配置的有效平台地址。 / Display only valid administrator-configured platform addresses. */
const platformLinks = [
  { name: 'AIOps', match: 'aiops', url: import.meta.env.VITE_XNET_AIOPS_URL },
  { name: 'DataOps', match: 'dataops', url: import.meta.env.VITE_XNET_DATAOPS_URL },
  { name: 'MLOps', match: 'mlops', url: import.meta.env.VITE_XNET_MLOPS_URL },
].filter((item) => {
  try {
    const url = new URL(item.url || '');
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
});
</script>

<template>
  <AuthPageLayout
    accent-color="#2f78b7"
    :app-name="appName"
    :platform-links="platformLinks"
    brand-surface="#0a1c2b"
    :logo="logo"
    :page-description="$t('authentication.pageDesc')"
    :page-title="$t('authentication.pageTitle')"
    preview-alt="从数据连接到质量治理与产品交付的数据流示意图"
    :preview-image="flowPreview"
    :product-summary="$t('authentication.platformSummary')"
    :toolbar-list="['language', 'theme']"
  />
</template>
