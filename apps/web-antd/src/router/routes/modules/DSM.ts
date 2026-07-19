import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:database',
      order: 2,
      title: '数据源管理',
    },
    name: 'DSM',
    path: '/DSM',
    children: [
      {
        name: 'DatasourceList',
        path: '/DSM/datasource/list',
        component: () => import('#/views/DSM/datasource/list.vue'),
        meta: {
          icon: 'lucide:hard-drive',
          title: '数据源列表',
        },
      },
      {
        name: 'DatasourceCreate',
        path: '/DSM/datasource/create',
        component: () => import('#/views/DSM/datasource/create.vue'),
        meta: {
          icon: 'lucide:plus-circle',
          title: '新建数据源',
        },
      },
    ],
  },
];

export default routes;
