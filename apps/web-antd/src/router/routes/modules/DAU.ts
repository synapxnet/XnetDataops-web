import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:clipboard-list',
      order: 12,
      title: '数据审计',
    },
    name: 'DAU',
    path: '/DAU',
    children: [
      {
        name: 'AuditLogList',
        path: '/DAU/log/list',
        component: () => import('#/views/DAU/log/list.vue'),
        meta: { icon: 'lucide:scroll-text', title: '操作审计' },
      },
      {
        name: 'DataChangeList',
        path: '/DAU/change/list',
        component: () => import('#/views/DAU/change/list.vue'),
        meta: { icon: 'lucide:file-diff', title: '数据变更' },
      },
      {
        name: 'ComplianceReportList',
        path: '/DAU/compliance/list',
        component: () => import('#/views/DAU/compliance/list.vue'),
        meta: { icon: 'lucide:file-check', title: '合规报告' },
      },
    ],
  },
];

export default routes;
