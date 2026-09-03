<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import type { OrganizationTreeNode } from '#/api/core';

import { computed, onMounted, provide, ref, watch } from 'vue';

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

import { getOrganizationTreeApi } from '#/api/core';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const OPENXNET_URL = 'https://openxnet.synapxnet.com';
const FRONTEND_REPOSITORY_URL = 'https://github.com/synapxnet/XnetDataops-web';
const BACKEND_REPOSITORY_URL = 'https://github.com/synapxnet/XnetDataops';
const ORGANIZATION_SCOPE_KEY = 'synapxnet:organization-scope';

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
  globalThis.sessionStorage?.removeItem(ORGANIZATION_SCOPE_KEY);
  await authStore.logout(false);
}

function handleNoticeClear() {
  notifications.value = [];
}

function handleMakeAll() {
  notifications.value.forEach((item) => (item.isRead = true));
}

interface SelectedOrganization {
  dataAccess: boolean;
  deptUid: null | string;
  level: number;
  teamUid: null | string;
  tenantUid: null | string;
}

const organizationTree = ref<OrganizationTreeNode[]>([]);
const organizationTreeLoaded = ref(false);
const selectedOrganization = ref<SelectedOrganization>({
  dataAccess: false,
  deptUid: null,
  level: 0,
  teamUid: null,
  tenantUid: null,
});

/** 返回组织树中第一条完整团队路径，可优先筛选已开启数据访问的团队。 */
function findFirstOrganizationPath(
  nodes: OrganizationTreeNode[],
  requireDataAccess: boolean,
): string[] {
  for (const tenant of nodes) {
    for (const department of tenant.children ?? []) {
      for (const team of department.children ?? []) {
        if (!requireDataAccess || team.dataAccess) {
          return [tenant.value, department.value, team.value];
        }
      }
    }
  }
  return [];
}

/** 根据级联路径查找服务端返回的组织节点。 */
function findOrganizationNode(
  nodes: OrganizationTreeNode[],
  path: string[],
  depth = 0,
): null | OrganizationTreeNode {
  if (depth >= path.length) return null;
  const node = nodes.find((item) => item.value === path[depth]);
  if (!node || depth === path.length - 1) return node ?? null;
  return findOrganizationNode(node.children ?? [], path, depth + 1);
}

/** 仅在当前页签保存组织范围，退出或换账号后不复用。 */
function writeOrganizationScope(scope: SelectedOrganization) {
  if (!scope.tenantUid || !scope.deptUid || !scope.teamUid) {
    globalThis.sessionStorage?.removeItem(ORGANIZATION_SCOPE_KEY);
    return;
  }
  globalThis.sessionStorage?.setItem(
    ORGANIZATION_SCOPE_KEY,
    JSON.stringify(scope),
  );
}

/** 加载当前用户被后端明确授权的组织树。 */
async function fetchOrganizationTree() {
  try {
    organizationTree.value = await getOrganizationTreeApi();
    const preferredPath = findFirstOrganizationPath(
      organizationTree.value,
      true,
    );
    const fallbackPath = findFirstOrganizationPath(
      organizationTree.value,
      false,
    );
    handleOrganizationChange(
      preferredPath.length > 0 ? preferredPath : fallbackPath,
    );
  } catch {
    console.error('获取组织树失败');
    organizationTree.value = [];
    handleOrganizationChange([]);
  } finally {
    organizationTreeLoaded.value = true;
  }
}

/** 更新当前会话的组织范围，不在浏览器中持久化跨账号权限状态。 */
function handleOrganizationChange(value: string[] = []) {
  const [tenantUid, deptUid, teamUid] = value;
  const selectedNode = findOrganizationNode(organizationTree.value, value);
  selectedOrganization.value = {
    dataAccess: value.length === 3 && Boolean(selectedNode?.dataAccess),
    deptUid: deptUid || null,
    level: value.length,
    teamUid: teamUid || null,
    tenantUid: tenantUid || null,
  };
  writeOrganizationScope(selectedOrganization.value);
}

// 根据组织树加载状态返回当前作用域标题。
const organizationScopeTitle = computed(() => {
  if (!organizationTreeLoaded.value) {
    return '正在加载组织权限';
  }
  if (organizationTree.value.length === 0) {
    return '当前账号未分配组织权限';
  }
  return '当前团队暂无业务数据';
});

// 根据组织树加载状态返回当前作用域提示。
const organizationScopeMessage = computed(() => {
  if (!organizationTreeLoaded.value) {
    return '请稍候';
  }
  if (organizationTree.value.length === 0) {
    return '没有可访问的租户、部门或团队。';
  }
  return '该团队用于场景迁移验证，尚未开启数据访问。';
});
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
provide('organizationTree', organizationTree);
provide('selectedOrganization', selectedOrganization);

onMounted(fetchOrganizationTree);
</script>

<template>
  <BasicLayout
    :content-enabled="organizationTreeLoaded && selectedOrganization.dataAccess"
    :tree-data="organizationTree"
    @clear-preferences-and-logout="handleLogout"
    @organization-change="handleOrganizationChange"
  >
    <template #content-placeholder>
      <section
        class="flex min-h-full items-center justify-center bg-white dark:bg-gray-950"
      >
        <div class="max-w-md px-8 text-center">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {{ organizationScopeTitle }}
          </h2>
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {{ organizationScopeMessage }}
          </p>
        </div>
      </section>
    </template>
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
