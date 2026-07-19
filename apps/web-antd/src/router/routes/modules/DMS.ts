import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:eye-off',
      order: 10,
      title: '数据脱敏',
    },
    name: 'DMS',
    path: '/DMS',
    children: [
      {
        name: 'MaskingRuleList',
        path: '/DMS/rule/list',
        component: () => import('#/views/DMS/rule/list.vue'),
        meta: {
          icon: 'lucide:shield',
          title: '脱敏规则',
        },
      },
      {
        name: 'MaskingPolicyList',
        path: '/DMS/policy/list',
        component: () => import('#/views/DMS/policy/list.vue'),
        meta: {
          icon: 'lucide:file-lock',
          title: '脱敏策略',
        },
      },
      {
        name: 'MaskingLogList',
        path: '/DMS/log/list',
        component: () => import('#/views/DMS/log/list.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '执行日志',
        },
      },
    ],
  },
];

export default routes;
