<!--
#!/usr/bin/env vue
# -*- coding: utf-8 -*-
# Copyright (C) 2026 Synapxnet. All rights reserved.
# This file is Synapxnet Proprietary and Confidential. It is strictly
# forbidden to copy, distribute, or use without explicit authorization.
# 复赛认证视觉与决赛入口 / Semifinal authentication visuals and finals navigation
# Author: maoyo | Department: 研发部 | Date: 2026-09-17
# Version: 1.3.0 | Security Level: INTERNAL
# Maintainer: maoyo | Email: synapxnet@gmail.com
-->
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
/** 使用原平台主色构建浅深主题变量。 / Build light and dark theme variables from the original platform colors. */
const shellStyle = computed(() => ({
  '--auth-accent': props.accentColor,
  '--auth-brand-surface': props.brandSurface,
}));
const platforms = [
  { name: 'AIOps', match: 'aiops', url: 'https://goai.xnetaiops.synapxnet.online/' },
  { name: 'DataOps', match: 'dataops', url: 'https://goai.xnetdataops.synapxnet.online/' },
  { name: 'MLOps', match: 'mlops', url: 'https://goai.xnetmlops.synapxnet.online/' },
];
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
      <nav class="auth-platforms" aria-label="Xnet platforms">
        <a v-for="platform in platforms" :key="platform.match" :href="platform.url"
          :aria-current="appName.toLowerCase().includes(platform.match) ? 'page' : undefined"
        >{{ platform.name }}</a>
      </nav>
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
  /* 区分文字与按钮强调色，保证两种主题可读。 / Separate text and button accents for readable contrast in both themes. */
  --auth-accent-text: color-mix(in srgb, var(--auth-accent) 76%, black);
  --auth-button-bg: color-mix(in srgb, var(--auth-accent) 86%, #08131c);
  --auth-canvas: #f7f9fc;
  --auth-panel-bg: #f9fbfe;
  --auth-panel-border: #d6e2ed;
  --auth-field-bg: #f0f5fa;
  --auth-field-border: #b3c6d8;
  --auth-panel-shadow: color-mix(
    in srgb,
    var(--auth-brand-surface) 14%,
    transparent
  );
  --auth-story-heading: #17314a;
  --auth-story-muted: #536678;
  position: relative;
  isolation: isolate;
  display: grid;
  min-height: 100dvh;
  grid-template-columns: minmax(0, 1.16fr) minmax(440px, 0.84fr);
  overflow: hidden;
  color: var(--auth-story-heading);
  background: linear-gradient(
    112deg,
    color-mix(in srgb, var(--auth-accent) 10%, var(--auth-canvas)) 0%,
    color-mix(in srgb, var(--auth-accent) 4%, var(--auth-canvas)) 52%,
    var(--auth-canvas) 100%
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
  --auth-accent-text: color-mix(in srgb, var(--auth-accent) 50%, white);
  --auth-canvas: #081724;
  --auth-panel-bg: #102333;
  --auth-panel-border: #2a4153;
  --auth-field-bg: #142b3c;
  --auth-field-border: #3b5264;
  --auth-panel-shadow: rgb(0 0 0 / 28%);
  --auth-story-heading: #edf5f6;
  --auth-story-muted: #a9bdcc;
  background: linear-gradient(
    112deg,
    color-mix(in srgb, var(--auth-brand-surface) 88%, var(--auth-accent)) 0%,
    var(--auth-brand-surface) 54%,
    color-mix(in srgb, var(--auth-brand-surface) 74%, var(--auth-canvas))
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
  color: var(--auth-accent-text);
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

.auth-platforms {
  display: flex;
  gap: 4px;
  margin: 0 0 28px;
  border-bottom: 1px solid var(--auth-panel-border);
}
.auth-platforms a {
  flex: 1;
  min-height: 40px;
  padding: 9px 12px;
  border-bottom: 2px solid transparent;
  color: var(--auth-story-muted);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
  transition: color 150ms ease, border-color 150ms ease;
}
.auth-platforms a:hover,
.auth-platforms a[aria-current="page"] { color: var(--auth-accent-text); }
.auth-platforms a[aria-current="page"] { border-bottom-color: var(--auth-accent-text); }
.auth-platforms a:focus-visible { outline: 2px solid var(--auth-accent-text); outline-offset: 3px; }
/* 三平台共享表单层级和输入表面。 / Share form hierarchy and field surfaces across all three platforms. */
.auth-shell :deep(.auth-mode-label) {
  margin: 0 0 10px;
  color: var(--auth-accent-text);
  font-size: 14px;
  font-weight: 650;
  line-height: 20px;
}
.auth-shell :deep(.auth-title) { margin-bottom: 28px; }
.auth-shell :deep(.auth-title h2) {
  margin: 0 0 12px;
  color: var(--auth-story-heading);
  font-size: 30px;
  font-weight: 700;
  line-height: 36px;
}
.auth-shell :deep(.auth-title p),
.auth-shell :deep(.auth-title .text-muted-foreground) {
  color: var(--auth-story-muted);
  font-size: 14px;
  line-height: 24px;
}
.auth-shell :deep(.auth-code-login input),
.auth-shell :deep(.dataops-login .ant-input) {
  min-height: 44px;
  border-color: var(--auth-field-border);
  color: var(--auth-story-heading);
  background: var(--auth-field-bg);
  font-size: 14px;
}
.auth-shell :deep(.auth-code-login input::placeholder),
.auth-shell :deep(.dataops-login .ant-input::placeholder) {
  color: var(--auth-story-muted);
  opacity: 1;
}
.auth-shell :deep(.auth-code-login input:focus),
.auth-shell :deep(.dataops-login .ant-input:focus) {
  border-color: var(--auth-accent-text);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--auth-accent) 16%, transparent);
}
.auth-shell :deep(.auth-code-login label),
.auth-shell :deep(.dataops-login .ant-form-item-label > label) {
  color: var(--auth-story-heading);
  font-size: 13px;
  font-weight: 600;
}
/* 对齐公共登录控件尺寸，同时保留短信组合输入。 / Match shared login control sizing while retaining the SMS input group. */
.auth-shell :deep(.dataops-login) { max-width: none; }
.auth-shell :deep(.dataops-login form .ant-input),
.auth-shell :deep(.dataops-login form .ant-btn) {
  height: 44px;
  min-height: 44px;
  border-radius: 6px;
  font-size: 14px;
}
.auth-shell :deep(.dataops-login form .ant-btn) { font-weight: 600; }
.auth-shell :deep(.dataops-login .login-links .ant-btn-link) {
  color: var(--auth-accent-text);
}
.auth-shell :deep(.dataops-login form .ant-btn:not(.ant-btn-primary)) {
  border-color: var(--auth-field-border);
  color: var(--auth-story-heading);
  background: var(--auth-field-bg);
}
.auth-shell :deep(.dataops-login form .ant-btn:not(.ant-btn-primary):hover:not(:disabled)) {
  border-color: var(--auth-accent-text);
  color: var(--auth-accent-text);
}
.auth-shell :deep(.dataops-login form .ant-input-compact-first-item) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.auth-shell :deep(.dataops-login form .ant-btn-compact-last-item) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
/* 同时覆盖本平台独立的短信表单。 / Include this platform's dedicated SMS form. */
.auth-shell :deep(.auth-code-login .auth-submit-button),
.auth-shell :deep(.dataops-login .ant-btn-primary) {
  border-color: var(--auth-button-bg) !important;
  color: #fff !important;
  background: var(--auth-button-bg) !important;
}
.auth-shell :deep(.auth-code-login .auth-submit-button:hover),
.auth-shell :deep(.dataops-login .ant-btn-primary:hover) {
  border-color: color-mix(in srgb, var(--auth-button-bg) 88%, #08131c) !important;
  background: color-mix(in srgb, var(--auth-button-bg) 88%, #08131c) !important;
}
.auth-shell :deep(.auth-code-login .auth-back-button) { display: none; }

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
  .auth-platforms a { transition: none; }
  .auth-story-copy,
  .auth-product-preview {
    animation: none;
  }
}
</style>
