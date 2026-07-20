import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:gem',
      order: 8,
      title: '数据资产',
    },
    name: 'DAS',
    path: '/DAS',
    children: [
      {
        name: 'AssetList',
        path: '/DAS/asset/list',
        component: () => import('#/views/DAS/asset/list.vue'),
        meta: {
          icon: 'lucide:box',
          title: '资产列表',
        },
      },
      {
        name: 'AssetCreate',
        path: '/DAS/asset/create',
        component: () => import('#/views/DAS/asset/create.vue'),
        meta: {
          icon: 'lucide:plus-circle',
          title: '新建资产',
          hideInMenu: true,
        },
      },
      {
        name: 'AssetDetail',
        path: '/DAS/asset/detail/:id',
        component: () => import('#/views/DAS/asset/detail.vue'),
        meta: {
          icon: 'lucide:info',
          title: '资产详情',
          hideInMenu: true,
        },
      },
      {
        name: 'AssetClassification',
        path: '/DAS/classification/list',
        component: () => import('#/views/DAS/classification/list.vue'),
        meta: {
          icon: 'lucide:folder-tree',
          title: '资产分类',
        },
      },
      {
        name: 'AssetStats',
        path: '/DAS/stats',
        component: () => import('#/views/DAS/stats.vue'),
        meta: {
          icon: 'lucide:bar-chart',
          title: '资产统计',
        },
      },
    ],
  },
];

export default routes;
