<script lang="ts" setup>
import { AuthPageLayout, logo } from '@vben/layouts';

import { $t } from '#/locales';

const appName = 'XnetDataops';
</script>

<template>
  <AuthPageLayout
    accent-color="#1b8f7a"
    :app-name="appName"
    brand-surface="#09211f"
    :logo="logo"
    :page-description="$t('authentication.pageDesc')"
    :page-title="$t('authentication.pageTitle')"
    :preview-alt="$t('authentication.previewAlt')"
    preview-image="/auth-platform.png"
    :product-summary="$t('authentication.platformSummary')"
    :toolbar-list="['language', 'theme']"
  />
</template>
