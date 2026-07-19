<script setup lang="ts">
import type { ToolbarType } from './types';

import { preferences, usePreferences } from '@vben/preferences';

import { Copyright } from '../basic/copyright';
import AuthenticationFormView from './form.vue';
import Toolbar from './toolbar.vue';

interface Props {
  appName?: string;
  logo?: string;
  pageTitle?: string;
  pageDescription?: string;
  sloganImage?: string;
  toolbar?: boolean;
  copyright?: boolean;
  toolbarList?: ToolbarType[];
}

withDefaults(defineProps<Props>(), {
  appName: '',
  copyright: true,
  logo: '',
  pageDescription: '',
  pageTitle: '',
  sloganImage: '',
  toolbar: true,
  toolbarList: () => ['color', 'language', 'layout', 'theme'],
});

const { authPanelRight, isDark } = usePreferences();
</script>

<template>
  <div
    :class="[isDark]"
    class="flex min-h-screen w-full flex-col items-center overflow-hidden"
  >
    <template v-if="toolbar">
      <slot name="toolbar">
        <Toolbar :toolbar-list="toolbarList" />
      </slot>
    </template>
    <!-- 头部 Logo 和应用名称 -->
    <div v-if="logo || appName" class="absolute left-0 top-0 z-10 flex flex-1">
      <div
        class="text-foreground lg:text-foreground ml-4 mt-4 flex flex-1 items-center sm:left-6 sm:top-6"
      >
        <img v-if="logo" :alt="appName" :src="logo" class="mr-2" width="42" />
        <p v-if="appName" class="m-0 text-xl font-medium">
          {{ appName }}
        </p>
      </div>
    </div>
    <!-- 右侧认证面板 -->
    <AuthenticationFormView
      v-if="authPanelRight"
      class="min-h-full w-[34%] flex-1"
    >
      <template v-if="copyright" #copyright>
        <slot name="copyright">
          <Copyright
            v-if="preferences.copyright.enable"
            v-bind="preferences.copyright"
          />
        </slot>
      </template>
    </AuthenticationFormView>
  </div>
</template>

<style scoped>
.login-background {
  background: linear-gradient(
    154deg,
    #07070915 30%,
    hsl(var(--primary) / 30%) 48%,
    #07070915 64%
  );
  filter: blur(100px);
}

.dark {
  .login-background {
    background: linear-gradient(
      154deg,
      #07070915 30%,
      hsl(var(--primary) / 20%) 48%,
      #07070915 64%
    );
    filter: blur(100px);
  }
}
</style>
