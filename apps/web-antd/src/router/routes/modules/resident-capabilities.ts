/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 驻场能力工作台入口 / Resident capability workbench route.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-19 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
import type { RouteRecordRaw } from 'vue-router';
const routes: RouteRecordRaw[] = [
  {
    name: 'ResidentCapabilities',
    path: '/AGENT/capabilities',
    component: () => import('#/views/AGENT/capabilities.vue'),
    meta: { title: '驻场能力工作台', icon: 'lucide:book-open', order: 2.5 },
  },
];
export default routes;
