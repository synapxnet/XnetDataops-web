<script lang="ts" setup>
import { AuthPageLayout, logo } from '@vben/layouts';

import flowPreview from '../assets/dataops-flow.svg';
import { $t } from '#/locales';

const appName = 'XnetDataops';
</script>

<template>
  <AuthPageLayout
    accent-color="#2f78b7"
    :app-name="appName"
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
