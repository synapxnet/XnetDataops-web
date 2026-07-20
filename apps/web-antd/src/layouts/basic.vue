<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, provide, ref, watch } from 'vue';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BookOpenText, MdiGithub } from '@vben/icons';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { openWindow } from '@vben/utils';

import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const OPENXNET_URL = 'https://openxnet.synapxnet.com';
const FRONTEND_REPOSITORY_URL = 'https://github.com/synapxnet/XnetDataops-web';
const BACKEND_REPOSITORY_URL = 'https://github.com/synapxnet/XnetDataops';

const notifications = ref<NotificationItem[]>([
  {
    avatar: 'https://avatar.vercel.sh/synapxnet.svg?text=SX',
    date: '3小时前',
    isRead: true,
    message: '描述信息描述信息描述信息',
    title: '收到了 14 份新周报',
  },
  {
    avatar: 'https://avatar.vercel.sh/1',
    date: '刚刚',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '朱偏右 回复了你',
  },
  {
    avatar: 'https://avatar.vercel.sh/1',
    date: '2024-01-01',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '曲丽丽 评论了你',
  },
  {
    avatar: 'https://avatar.vercel.sh/satori',
    date: '1天前',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '代办提醒',
  },
]);

const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const showDot = computed(() =>
  notifications.value.some((item) => !item.isRead),
);

const menus = computed(() => [
  {
    handler: () => {
      openWindow(OPENXNET_URL, {
        target: '_blank',
      });
    },
    icon: BookOpenText,
    text: 'OpenXnet 开源社区',
  },
  {
    handler: () => {
      openWindow(FRONTEND_REPOSITORY_URL, {
        target: '_blank',
      });
    },
    icon: MdiGithub,
    text: 'XnetDataops Web 源码',
  },
  {
    handler: () => {
      openWindow(BACKEND_REPOSITORY_URL, {
        target: '_blank',
      });
    },
    icon: MdiGithub,
    text: 'XnetDataops 后端源码',
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleNoticeClear() {
  notifications.value = [];
}

function handleMakeAll() {
  notifications.value.forEach((item) => (item.isRead = true));
}
watch(
  () => preferences.app.watermark,
  async (enable) => {
    if (enable) {
      await updateWatermark({
        content: `${userStore.userInfo?.username}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
// 提供当前用户信息
const userInfo = computed(() => userStore.userInfo);
provide('currentUserInfo', userInfo);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        description="SynapXnet 开源团队"
        tag-text="1.0.0"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        :dot="showDot"
        :notifications="notifications"
        @clear="handleNoticeClear"
        @make-all="handleMakeAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
