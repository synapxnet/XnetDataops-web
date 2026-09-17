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
import { useRouter } from 'vue-router';
import { Button } from 'ant-design-vue';
const router = useRouter();
</script>
<template>
  <section class="account-help">
    <h1>扫码登录尚未接入</h1>
    <p>当前服务尚未提供二维码会话和确认接口。请使用已接入的短信验证码登录。</p>
    <Button type="primary" size="large" @click="router.push('/auth/login')"
      >使用手机号登录</Button
    >
  </section>
</template>
<style scoped>
.account-help {
  max-width: 420px;
  margin: auto;
}
.account-help > span {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: hsl(var(--primary));
  font-weight: 700;
}
.account-help h1 {
  font-size: 22px;
  font-weight: 650;
  margin: 16px 0;
}
.account-help p {
  font-size: 14px;
  line-height: 1.9;
  color: hsl(var(--muted-foreground));
  margin-bottom: 20px;
}
</style>
