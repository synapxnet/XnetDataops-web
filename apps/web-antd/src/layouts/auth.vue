<script lang="ts" setup>
import { AuthPageLayout, logo } from '@vben/layouts';

import { $t } from '#/locales';

const appName = 'XnetDataops';
// const appName = computed(() => preferences.app.name);
// const logo = computed(() => preferences.logo.source);
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :page-description="$t('authentication.pageDesc')"
    :page-title="$t('authentication.pageTitle')"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
