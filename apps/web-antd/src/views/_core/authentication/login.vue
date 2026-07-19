<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, ref } from 'vue';

import { AuthenticationCodeLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { getCodeData } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();
const CODE_LENGTH = 6;
const phone = ref('');

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.mobile'),
      },
      fieldName: 'phoneNumber',
      label: $t('authentication.mobile'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.mobileTip') })
        .refine(
          (v) => {
            phone.value = v;
            return /^\d{11}$/.test(v);
          },
          {
            message: $t('authentication.mobileErrortip'),
          },
        ),
    },
    {
      component: 'VbenPinInput',
      componentProps: {
        codeLength: CODE_LENGTH,
        createText: (countdown: number) => {
          const text =
            countdown > 0
              ? $t('authentication.sendText', [countdown])
              : $t('authentication.sendCode');
          return text;
        },
        placeholder: $t('authentication.code'),
        handleSendCode: handleGetCode,
      },
      fieldName: 'code',
      label: $t('authentication.code'),
      rules: z.string().length(CODE_LENGTH, {
        message: $t('authentication.codeTip', [CODE_LENGTH]),
      }),
    },
  ];
});

const handleGetCode = async () => {
  const params = {
    userPhone: phone.value,
  };
  await getCodeData(params);
};
</script>

<template>
  <AuthenticationCodeLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="authStore.authCodeLogin"
  />
</template>
