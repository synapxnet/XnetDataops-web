import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: 1,
      title: '数据总览',
    },
    name: 'Dashboard',
    path: '/dashboard',
    children: [
      {
        name: 'DashboardOverview',
        path: '/dashboard/overview',
        component: () => import('#/views/dashboard/overview.vue'),
        meta: {
          icon: 'lucide:bar-chart-3',
          title: '平台概览',
        },
      },
    ],
  },
];

export default routes;
