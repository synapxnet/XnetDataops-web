import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:code-2',
      order: 4,
      title: '数据开发',
    },
    name: 'DDV',
    path: '/DDV',
    children: [
      {
        name: 'SqlWorkbench',
        path: '/DDV/workbench',
        component: () => import('#/views/DDV/workbench.vue'),
        meta: {
          icon: 'lucide:terminal',
          title: 'SQL工作台',
        },
      },
      {
        name: 'ScriptList',
        path: '/DDV/script/list',
        component: () => import('#/views/DDV/script/list.vue'),
        meta: {
          icon: 'lucide:file-code',
          title: '脚本管理',
        },
      },
      {
        name: 'QueryHistory',
        path: '/DDV/history',
        component: () => import('#/views/DDV/history.vue'),
        meta: {
          icon: 'lucide:history',
          title: '查询历史',
        },
      },
    ],
  },
];

export default routes;
