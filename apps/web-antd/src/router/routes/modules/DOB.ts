import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:activity',
      order: 11,
      title: '数据可观测',
    },
    name: 'DOB',
    path: '/DOB',
    children: [
      {
        name: 'DataMonitorList',
        path: '/DOB/monitor/list',
        component: () => import('#/views/DOB/monitor/list.vue'),
        meta: {
          icon: 'lucide:radar',
          title: '数据监控',
        },
      },
      {
        name: 'MonitorEventList',
        path: '/DOB/event/list',
        component: () => import('#/views/DOB/event/list.vue'),
        meta: {
          icon: 'lucide:bell',
          title: '监控事件',
        },
      },
      {
        name: 'DataSlaList',
        path: '/DOB/sla/list',
        component: () => import('#/views/DOB/sla/list.vue'),
        meta: {
          icon: 'lucide:clock',
          title: 'SLA管理',
        },
      },
    ],
  },
];

export default routes;
