<script setup lang="ts">
import type { ToolbarType } from './types';

import { computed } from 'vue';

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
  accentColor?: string;
  brandSurface?: string;
  previewAlt?: string;
  previewImage?: string;
  productSummary?: string;
  toolbar?: boolean;
  copyright?: boolean;
  toolbarList?: ToolbarType[];
}

const props = withDefaults(defineProps<Props>(), {
  appName: '',
  accentColor: '#2f7fb5',
  brandSurface: '#0a1c2b',
  copyright: true,
  logo: '',
  pageDescription: '',
  pageTitle: '',
  previewAlt: '',
  previewImage: '',
  productSummary: '',
  sloganImage: '',
  toolbar: true,
  toolbarList: () => ['language', 'theme'],
});

const { isDark } = usePreferences();
const shellStyle = computed(() => ({
  '--auth-accent': props.accentColor,
  '--auth-brand-surface': props.brandSurface,
}));
</script>

<template>
  <div
    :class="{ 'auth-shell--dark': isDark, dark: isDark }"
    :style="shellStyle"
    class="auth-shell"
  >
    <template v-if="toolbar">
      <slot name="toolbar">
        <Toolbar :toolbar-list="toolbarList" />
      </slot>
    </template>
    <div v-if="logo || appName" class="auth-brand-mark">
      <img v-if="logo" :alt="appName" :src="logo" height="42" width="42" />
      <div>
        <strong v-if="appName">{{ appName }}</strong>
        <span v-if="pageDescription">{{ pageDescription }}</span>
      </div>
    </div>

    <aside class="auth-story">
      <div class="auth-story-copy">
        <p>{{ pageDescription }}</p>
        <h1>{{ pageTitle }}</h1>
        <span>{{ productSummary }}</span>
      </div>

      <figure v-if="previewImage" class="auth-product-preview">
        <img
          :alt="previewAlt || appName"
          decoding="async"
          height="900"
          loading="eager"
          :src="previewImage"
          width="1440"
        />
      </figure>

      <span class="auth-story-owner">SynapXnet</span>
    </aside>

    <AuthenticationFormView class="auth-form-panel">
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
.auth-shell {
  position: relative;
  display: grid;
  min-height: 100dvh;
  grid-template-columns: minmax(0, 1.12fr) minmax(420px, 0.88fr);
  overflow: hidden;
  color: hsl(var(--foreground));
  background: hsl(var(--background));
}

.auth-brand-mark {
  position: absolute;
  top: 24px;
  left: 28px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #eef6f7;
}

.auth-brand-mark img {
  object-fit: contain;
}

.auth-brand-mark div {
  display: grid;
  gap: 1px;
}

.auth-brand-mark strong {
  font-size: 18px;
  font-weight: 680;
}

.auth-brand-mark span {
  color: rgb(231 241 244 / 66%);
  font-size: 11px;
}

.auth-story {
  position: relative;
  min-width: 0;
  min-height: 100dvh;
  padding: 116px clamp(36px, 5vw, 78px) 40px;
  overflow: hidden;
  color: #edf5f6;
  background: var(--auth-brand-surface);
  border-left: 4px solid var(--auth-accent);
}

.auth-story-copy {
  position: relative;
  z-index: 2;
  max-width: 560px;
  animation: auth-enter 460ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.auth-story-copy p {
  margin: 0 0 12px;
  color: color-mix(in srgb, var(--auth-accent) 82%, white);
  font-size: 13px;
  font-weight: 650;
}

.auth-story-copy h1 {
  margin: 0;
  font-size: clamp(38px, 4.1vw, 62px);
  font-weight: 720;
  letter-spacing: 0;
  line-height: 1.08;
}

.auth-story-copy span {
  display: block;
  max-width: 46ch;
  margin-top: 18px;
  color: rgb(230 240 243 / 72%);
  font-size: 15px;
  line-height: 1.75;
}

.auth-product-preview {
  position: absolute;
  right: -12%;
  bottom: -7%;
  width: min(92%, 920px);
  aspect-ratio: 16 / 10;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 8px;
  background: #101921;
  box-shadow: 0 32px 80px rgb(0 0 0 / 34%);
  transform: rotate(-1deg);
  animation: auth-preview-enter 620ms 80ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.auth-product-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: left top;
}

.auth-story-owner {
  position: absolute;
  bottom: 28px;
  left: clamp(36px, 5vw, 78px);
  z-index: 2;
  color: rgb(231 241 244 / 54%);
  font-size: 12px;
}

.auth-form-panel {
  min-width: 0;
  min-height: 100dvh;
}

@keyframes auth-enter {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes auth-preview-enter {
  from {
    opacity: 0;
    transform: translateY(28px) rotate(-1deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(-1deg);
  }
}

@media (max-width: 900px) {
  .auth-shell {
    display: block;
  }

  .auth-story {
    display: none;
  }

  .auth-brand-mark {
    color: hsl(var(--foreground));
  }

  .auth-brand-mark span {
    color: hsl(var(--muted-foreground));
  }
}

@media (max-width: 480px) {
  .auth-brand-mark {
    top: 18px;
    left: 20px;
  }

  .auth-brand-mark img {
    width: 36px;
    height: 36px;
  }

  .auth-brand-mark span {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-story-copy,
  .auth-product-preview {
    animation: none;
  }
}
</style>
