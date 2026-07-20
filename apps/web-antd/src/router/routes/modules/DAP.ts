import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:plug',
      order: 9,
      title: '数据API',
    },
    name: 'DAP',
    path: '/DAP',
    children: [
      {
        name: 'ApiConfigList',
        path: '/DAP/config/list',
        component: () => import('#/views/DAP/config/list.vue'),
        meta: {
          icon: 'lucide:settings',
          title: 'API配置',
        },
      },
      {
        name: 'ApiConfigCreate',
        path: '/DAP/config/create',
        component: () => import('#/views/DAP/config/create.vue'),
        meta: {
          icon: 'lucide:plus-circle',
          title: '新建API',
          hideInMenu: true,
        },
      },
      {
        name: 'ApiKeyList',
        path: '/DAP/key/list',
        component: () => import('#/views/DAP/key/list.vue'),
        meta: {
          icon: 'lucide:key',
          title: 'API密钥',
        },
      },
      {
        name: 'ApiCallLogList',
        path: '/DAP/log/list',
        component: () => import('#/views/DAP/log/list.vue'),
        meta: {
          icon: 'lucide:scroll-text',
          title: '调用日志',
        },
      },
    ],
  },
];

export default routes;
