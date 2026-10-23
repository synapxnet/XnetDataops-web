<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import type { OrganizationTreeNode } from '#/api/core';

import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';

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
import {
  clearPageStates,
  hasUnsavedPages,
} from '#/components/data-page/request-state';
import { skinPanelOpen } from '#/appearance/skin';
import LoginForm from '#/views/_core/authentication/login.vue';
import ResidentAgentPanel from '#/components/resident/ResidentAgentPanel.vue';

const OPENXNET_URL = 'https://openxnet.synapxnet.com';
const FRONTEND_REPOSITORY_URL = 'https://github.com/synapxnet/XnetDataops-web';
const BACKEND_REPOSITORY_URL = 'https://github.com/synapxnet/XnetDataops';
const ORGANIZATION_SCOPE_KEY = 'synapxnet:organization-scope';

const notifications = ref<NotificationItem[]>([]);
const contentEpoch = ref(0);
/** 换组织前保护当前团队的未保存草稿。 Protect unsaved drafts before changing the active organization. */
function confirmOrganizationChange() {
  return (
    !hasUnsavedPages() ||
    window.confirm('切换组织会丢弃未保存的修改，继续切换？')
  );
}
/** 重新加载业务内容并清除旧组织缓存。 Reload business content and discard stale organization caches. */
function refreshBusinessContent() {
  clearPageStates();
  contentEpoch.value++;
}
onMounted(() =>
  window.addEventListener('dataops:refresh-page', refreshBusinessContent),
);
onBeforeUnmount(() =>
  window.removeEventListener('dataops:refresh-page', refreshBusinessContent),
);

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
      skinPanelOpen.value = true;
    },
    icon: BookOpenText,
    text: '外观与皮肤',
  },
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

/** 返回组织树中第一条完整团队路径，可优先筛选已开启数据访问的团队。 Find the first complete team path, preferring teams with data access when requested. */
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

/** 根据级联路径查找服务端返回的组织节点。 Resolve a node from the server-provided organization tree. */
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

/** 仅在当前页签保存组织范围，退出或换账号后不复用。 Store scope only for this tab and discard it on logout or account changes. */
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

/** 加载当前用户被后端明确授权的组织树。 Load the organization tree explicitly authorized for the current user. */
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

/** 更新当前会话的组织范围，不在浏览器中持久化跨账号权限状态。 Update session organization scope and remount business content without persisting cross-account permissions. */
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
  refreshBusinessContent();
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
    :content-key="contentEpoch"
    :before-organization-change="confirmOrganizationChange"
    :content-enabled="organizationTreeLoaded && selectedOrganization.dataAccess"
    :tree-data="organizationTree"
    @clear-preferences-and-logout="handleLogout"
    @organization-change="handleOrganizationChange"
  >
    <template #header-right-45>
      <ResidentAgentPanel
        platform="dataops"
        :scope="selectedOrganization"
        :enabled="organizationTreeLoaded"
      />
    </template>
    <template #content-placeholder>
      <section class="data-scope-empty">
        <div class="data-scope-heading">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            aria-hidden="true"
          >
            <path d="M3 8h18v12H3zM3 8l3-4h5l2 4M8 13h8M8 16h5" />
          </svg>
          <span>组织数据</span>
        </div>
        <div class="data-scope-body">
          <h2>
            {{ organizationScopeTitle }}
          </h2>
          <p>
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

<style scoped>
.data-scope-empty {
  margin: var(--dataops-space);
  max-width: 960px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--dataops-radius);
}
.data-scope-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 16px 20px;
  border-bottom: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 600;
}
.data-scope-heading svg {
  color: hsl(var(--primary));
}
.data-scope-body {
  padding: 32px 24px 40px;
}
.data-scope-body h2 {
  margin: 0 0 10px;
  font-size: 17px;
  font-weight: 600;
}
.data-scope-body p {
  margin: 0;
  color: hsl(var(--muted-foreground));
  font-size: 13px;
  line-height: 1.8;
}
</style>
