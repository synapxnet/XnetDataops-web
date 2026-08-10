<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed } from 'vue';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'CodeLogin' });

const authStore = useAuthStore();
const CODE_LENGTH = 6;
const DEMO_PHONE = '17870171303';
const DEMO_VERIFICATION_CODE = '000000';

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.mobile'),
      },
      defaultValue: DEMO_PHONE,
      fieldName: 'phoneNumber',
      label: $t('authentication.mobile'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.mobileTip') })
        .refine((v) => /^\d{11}$/.test(v), {
          message: $t('authentication.mobileErrortip'),
        }),
    },
    {
      component: 'VbenPinInput',
      componentProps: {
        codeLength: CODE_LENGTH,
        placeholder: $t('authentication.code'),
        showSendButton: false,
      },
      defaultValue: DEMO_VERIFICATION_CODE,
      fieldName: 'code',
      label: $t('authentication.code'),
      rules: z.string().length(CODE_LENGTH, {
        message: $t('authentication.codeTip', [CODE_LENGTH]),
      }),
    },
  ];
});
</script>

<template>
  <AuthenticationCodeLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authCodeLogin"
  />
</template>
