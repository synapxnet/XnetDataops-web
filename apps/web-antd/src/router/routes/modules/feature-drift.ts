/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 跨域真实执行证据深链 / Deep link for real cross-domain execution evidence.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-18 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'FeatureDriftExecutionEvidence',
    path: '/AGENT/feature-drift',
    // 原生菜单进入同一证据工作区。 Open the shared evidence workspace from native menus.
    component: () => import('#/views/AGENT/feature-drift.vue'),
    meta: {
      title: '跨域恢复证据',
      icon: 'lucide:git-pull-request-arrow',
      hideInMenu: true,
      // 与原生只读页共享登录守卫，数据权限由驻场服务按组织及工作空间校验。
      // Share the native read-only login guard; the resident enforces organization and workspace access.
    },
  },
];

export default routes;
