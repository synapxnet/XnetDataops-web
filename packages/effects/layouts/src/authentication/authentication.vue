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
  --auth-panel-bg: color-mix(
    in srgb,
    hsl(var(--background)) 96%,
    var(--auth-accent)
  );
  --auth-panel-border: color-mix(
    in srgb,
    var(--auth-accent) 18%,
    hsl(var(--border))
  );
  --auth-panel-shadow: color-mix(
    in srgb,
    var(--auth-brand-surface) 14%,
    transparent
  );
  --auth-story-heading: color-mix(
    in srgb,
    var(--auth-brand-surface) 82%,
    hsl(var(--foreground))
  );
  --auth-story-muted: color-mix(
    in srgb,
    hsl(var(--muted-foreground)) 88%,
    var(--auth-accent)
  );
  position: relative;
  isolation: isolate;
  display: grid;
  min-height: 100dvh;
  grid-template-columns: minmax(0, 1.16fr) minmax(440px, 0.84fr);
  overflow: hidden;
  color: hsl(var(--foreground));
  background: linear-gradient(
    112deg,
    color-mix(in srgb, var(--auth-accent) 10%, hsl(var(--background))) 0%,
    color-mix(in srgb, var(--auth-accent) 4%, hsl(var(--background))) 52%,
    hsl(var(--background)) 100%
  );
}

.auth-shell::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(
    150deg,
    color-mix(in srgb, var(--auth-accent) 7%, transparent),
    transparent 48%
  );
  content: '';
  pointer-events: none;
}

.auth-shell--dark {
  --auth-panel-bg: color-mix(
    in srgb,
    var(--auth-brand-surface) 84%,
    hsl(var(--background))
  );
  --auth-panel-border: color-mix(
    in srgb,
    var(--auth-accent) 28%,
    rgb(255 255 255 / 14%)
  );
  --auth-panel-shadow: rgb(0 0 0 / 28%);
  --auth-story-heading: #edf5f6;
  --auth-story-muted: rgb(230 240 243 / 72%);
  background: linear-gradient(
    112deg,
    color-mix(in srgb, var(--auth-brand-surface) 88%, var(--auth-accent)) 0%,
    var(--auth-brand-surface) 54%,
    color-mix(in srgb, var(--auth-brand-surface) 74%, hsl(var(--background)))
      100%
  );
}

.auth-brand-mark {
  position: absolute;
  top: 28px;
  left: 36px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--auth-story-heading);
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
  color: var(--auth-story-muted);
  font-size: 11px;
}

.auth-story {
  position: relative;
  min-width: 0;
  min-height: 100dvh;
  padding: 116px clamp(36px, 5vw, 78px) 40px;
  overflow: hidden;
  color: var(--auth-story-heading);
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
  color: var(--auth-story-heading);
  font-size: clamp(38px, 4.1vw, 62px);
  font-weight: 720;
  letter-spacing: 0;
  line-height: 1.08;
}

.auth-story-copy span {
  display: block;
  max-width: 46ch;
  margin-top: 18px;
  color: var(--auth-story-muted);
  font-size: 15px;
  line-height: 1.75;
}

.auth-product-preview {
  position: absolute;
  right: -4%;
  bottom: -7%;
  width: min(88%, 920px);
  aspect-ratio: 16 / 10;
  margin: 0;
  overflow: hidden;
  border: 1px solid
    color-mix(in srgb, var(--auth-accent) 24%, hsl(var(--border)));
  border-radius: 8px;
  background: #101921;
  box-shadow: 0 32px 80px var(--auth-panel-shadow);
  transform: rotate(-1deg);
  mask-image: linear-gradient(to right, black 0%, black 88%, transparent 100%);
  -webkit-mask-image: linear-gradient(
    to right,
    black 0%,
    black 88%,
    transparent 100%
  );
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
  color: var(--auth-story-muted);
  font-size: 12px;
}

.auth-form-panel {
  align-self: center;
  min-width: 0;
  margin: 28px 28px 28px 8px;
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
    top: 34px;
    left: 32px;
  }

  .auth-form-panel {
    margin: 12px;
  }
}

@media (max-width: 480px) {
  .auth-brand-mark {
    top: 30px;
    left: 28px;
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
