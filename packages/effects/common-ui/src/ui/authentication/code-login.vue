<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '@vben-core/form-ui';

import { computed, reactive } from 'vue';
import { useRouter } from 'vue-router';

import { $t } from '@vben/locales';

import { useVbenForm } from '@vben-core/form-ui';
import { VbenButton } from '@vben-core/shadcn-ui';

import Title from './auth-title.vue';

interface Props {
  formSchema: VbenFormSchema[];
  /**
   * @zh_CN 是否处于加载处理状态
   */
  loading?: boolean;
  /**
   * @zh_CN 登录路径
   */
  loginPath?: string;
  /**
   * @zh_CN 标题
   */
  title?: string;
  /**
   * @zh_CN 描述
   */
  subTitle?: string;
  /**
   * @zh_CN 按钮文本
   */
  submitButtonText?: string;
}

defineOptions({
  name: 'AuthenticationCodeLogin',
});

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loginPath: '/auth/login',
  submitButtonText: '',
  subTitle: '',
  title: '',
});

const emit = defineEmits<{
  submit: [Recordable<any>];
}>();

const router = useRouter();

const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: {
      hideLabel: false,
      hideRequiredMark: true,
    },
    layout: 'vertical',
    schema: computed(() => props.formSchema),
    showDefaultActions: false,
  }),
);

async function handleSubmit() {
  const { valid } = await formApi.validate();
  const values = await formApi.getValues();
  if (valid) {
    emit('submit', values);
  }
}

function goToLogin() {
  router.push(props.loginPath);
}

defineExpose({
  getFormApi: () => formApi,
});
</script>

<template>
  <div class="auth-code-login">
    <p class="auth-mode-label">{{ $t('authentication.mobileLogin') }}</p>
    <Title>
      <slot name="title">
        {{ title || $t('authentication.welcomeBack') }}
      </slot>
      <template #desc>
        <span class="text-muted-foreground">
          <slot name="subTitle">
            {{ subTitle || $t('authentication.codeSubtitle') }}
          </slot>
        </span>
      </template>
    </Title>
    <Form />
    <VbenButton
      :class="{
        'cursor-wait': loading,
      }"
      :loading="loading"
      class="auth-submit-button w-full"
      @click="handleSubmit"
    >
      <slot name="submitButtonText">
        {{ submitButtonText || $t('common.login') }}
      </slot>
    </VbenButton>
    <VbenButton
      class="auth-back-button mt-3 w-full"
      variant="outline"
      @click="goToLogin()"
    >
      {{ $t('common.back') }}
    </VbenButton>
  </div>
</template>

<style scoped>
.auth-code-login {
  width: 100%;
}

.auth-mode-label {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 650;
  color: var(--auth-accent);
}

.auth-submit-button,
.auth-back-button {
  min-height: 44px;
  font-weight: 600;
  border-radius: 6px;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.auth-submit-button {
  color: #f7fbfc !important;
  background: var(--auth-accent) !important;
  border-color: var(--auth-accent) !important;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--auth-accent) 22%, transparent);
}

.auth-submit-button:hover {
  background: color-mix(in srgb, var(--auth-accent) 88%, #0a1520) !important;
  border-color: color-mix(in srgb, var(--auth-accent) 88%, #0a1520) !important;
}

.auth-back-button {
  background: transparent !important;
  border-color: var(--auth-panel-border) !important;
}

.auth-back-button:hover {
  color: var(--auth-accent) !important;
  background: color-mix(in srgb, var(--auth-accent) 8%, transparent) !important;
}

.auth-code-login :deep(input) {
  min-height: 44px;
  background: color-mix(
    in srgb,
    var(--auth-panel-bg) 88%,
    hsl(var(--background))
  );
  border-color: var(--auth-panel-border);
}

.auth-code-login :deep(input:focus) {
  border-color: var(--auth-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--auth-accent) 14%, transparent);
}

.auth-code-login :deep(label) {
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--foreground));
}

.auth-submit-button:active,
.auth-back-button:active {
  transform: translateY(1px);
}

@media (prefers-reduced-motion: reduce) {
  .auth-submit-button,
  .auth-back-button {
    transition: none;
  }
}
</style>
