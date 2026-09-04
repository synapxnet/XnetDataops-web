<script setup lang="ts">
import type { ToolbarType } from './types';

import { computed } from 'vue';

import { preferences } from '@vben/preferences';

import {
  AuthenticationColorToggle,
  AuthenticationLayoutToggle,
  LanguageToggle,
  ThemeToggle,
} from '../widgets';

interface Props {
  toolbarList?: ToolbarType[];
}

defineOptions({
  name: 'AuthenticationToolbar',
});

const props = withDefaults(defineProps<Props>(), {
  toolbarList: () => ['color', 'language', 'layout', 'theme'],
});

const showColor = computed(() => props.toolbarList.includes('color'));
const showLayout = computed(() => props.toolbarList.includes('layout'));
const showLanguage = computed(() => props.toolbarList.includes('language'));
const showTheme = computed(() => props.toolbarList.includes('theme'));
</script>

<template>
  <div class="auth-toolbar">
    <!-- Only show on medium and larger screens -->
    <div class="hidden md:flex">
      <AuthenticationColorToggle v-if="showColor" />
      <AuthenticationLayoutToggle v-if="showLayout" />
    </div>
    <!-- Always show Language and Theme toggles -->
    <LanguageToggle v-if="showLanguage && preferences.widget.languageToggle" />
    <ThemeToggle v-if="showTheme && preferences.widget.themeToggle" />
  </div>
</template>

<style scoped>
.auth-toolbar {
  position: absolute;
  top: 44px;
  right: clamp(40px, 4vw, 68px);
  z-index: 30;
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 2px 6px;
  color: hsl(var(--foreground));
  background: var(--auth-panel-bg);
  border: 1px solid var(--auth-panel-border);
  border-radius: 6px;
  box-shadow: 0 8px 22px var(--auth-panel-shadow);
}

@media (max-width: 480px) {
  .auth-toolbar {
    top: 26px;
    right: 26px;
  }
}
</style>
