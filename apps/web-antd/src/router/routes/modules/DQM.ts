import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 6,
      title: '数据质量',
    },
    name: 'DQM',
    path: '/DQM',
    children: [
      {
        name: 'QualityRuleList',
        path: '/DQM/rule/list',
        component: () => import('#/views/DQM/rule/list.vue'),
        meta: {
          icon: 'lucide:list-checks',
          title: '质量规则',
        },
      },
      {
        name: 'QualityReportList',
        path: '/DQM/report/list',
        component: () => import('#/views/DQM/report/list.vue'),
        meta: {
          icon: 'lucide:file-bar-chart',
          title: '检测报告',
        },
      },
      {
        name: 'QualityAlertList',
        path: '/DQM/alert/list',
        component: () => import('#/views/DQM/alert/list.vue'),
        meta: {
          icon: 'lucide:bell-ring',
          title: '质量告警',
        },
      },
    ],
  },
];

export default routes;
