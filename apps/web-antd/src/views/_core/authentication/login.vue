<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：账户入口与能力说明。Purpose: Account entry and truthful capability status.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
-->
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Alert,
  Button,
  Form,
  FormItem,
  Input,
  Space,
  message,
} from 'ant-design-vue';
import { getCodeData } from '#/api/core/auth';
import { useAuthStore } from '#/store';
const auth = useAuthStore(),
  router = useRouter(),
  phone = ref(''),
  code = ref(''),
  sending = ref(false),
  countdown = ref(0),
  error = ref('');
let timer: ReturnType<typeof setInterval> | undefined;
/** 向真实短信接口请求验证码，成功后开始倒计时。 Request a code from the actual SMS endpoint and start the countdown only on success. */
async function sendCode() {
  if (sending.value || countdown.value) return;
  if (!/^\d{11}$/.test(phone.value)) {
    error.value = '请输入11位手机号';
    return;
  }
  sending.value = true;
  error.value = '';
  try {
    await getCodeData({ userPhone: phone.value });
    message.success('验证码已发送');
    countdown.value = 60;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) clearInterval(timer);
    }, 1000);
  } catch {
    error.value = '验证码发送失败，请稍后重试';
  } finally {
    sending.value = false;
  }
}
/** 校验输入并提交短信登录，失败时保留填写内容。 Validate input and submit SMS login while retaining input on failure. */
async function login() {
  if (auth.loginLoading) return;
  if (!/^\d{11}$/.test(phone.value) || !/^\d{6}$/.test(code.value)) {
    error.value = '请输入有效手机号和6位验证码';
    return;
  }
  error.value = '';
  try {
    const result = await auth.authCodeLogin({
      phoneNumber: phone.value,
      code: code.value,
    });
    if (!result.userInfo)
      error.value = '登录未完成，请检查验证码与服务连接后重试';
  } catch {
    error.value = '登录未完成，请检查验证码后重试';
  }
}
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>
<template>
  <section class="dataops-login">
    <p class="auth-mode-label">手机号登录</p>
    <div class="auth-title">
      <h2>欢迎登录</h2>
      <p>登录后进入你的数据治理工作台</p>
    </div>
    <Alert v-if="error" :message="error" type="warning" show-icon /><Form
      layout="vertical"
      @submit.prevent="login"
      ><FormItem label="手机号"
        ><Input
          v-model:value="phone"
          size="large"
          inputmode="tel"
          autocomplete="tel"
          :maxlength="11"
          placeholder="请输入手机号" /></FormItem
      ><FormItem label="短信验证码"
        ><Space.Compact style="width: 100%"
          ><Input
            v-model:value="code"
            size="large"
            inputmode="numeric"
            autocomplete="one-time-code"
            :maxlength="6"
            placeholder="6位验证码"
          /><Button
            size="large"
            :loading="sending"
            :disabled="countdown > 0"
            @click="sendCode"
            >{{ countdown > 0 ? countdown + '秒后重试' : '获取验证码' }}</Button
          ></Space.Compact
        ></FormItem
      ><Button
        html-type="button"
        @click="login"
        type="primary"
        size="large"
        block
        :loading="auth.loginLoading"
        >登录工作空间</Button
      ></Form
    >
    <div class="login-links">
      <Button type="link" @click="router.push('/auth/register')"
        >账号开通</Button
      ><Button type="link" @click="router.push('/auth/forget-password')"
        >登录帮助</Button
      ><Button type="link" @click="router.push('/auth/qrcode-login')"
        >扫码登录</Button
      >
    </div>
  </section>
</template>
<style scoped>
.dataops-login {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}
.dataops-login form {
  margin-top: 0;
}
.dataops-login :deep(.ant-alert) {
  margin-bottom: 16px;
}
.login-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 16px;
}
</style>
