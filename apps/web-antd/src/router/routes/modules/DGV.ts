import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:library',
      order: 7,
      title: '数据治理',
    },
    name: 'DGV',
    path: '/DGV',
    children: [
      {
        name: 'MetaCatalogList',
        path: '/DGV/catalog/list',
        component: () => import('#/views/DGV/catalog/list.vue'),
        meta: {
          icon: 'lucide:table-2',
          title: '数据目录',
        },
      },
      {
        name: 'MetaCatalogDetail',
        path: '/DGV/catalog/detail/:id',
        component: () => import('#/views/DGV/catalog/detail.vue'),
        meta: {
          icon: 'lucide:info',
          title: '表详情',
          hideInMenu: true,
        },
      },
      {
        name: 'DataLineage',
        path: '/DGV/lineage',
        component: () => import('#/views/DGV/lineage.vue'),
        meta: {
          icon: 'lucide:git-branch',
          title: '数据血缘',
        },
      },
      {
        name: 'DataTagList',
        path: '/DGV/tag/list',
        component: () => import('#/views/DGV/tag/list.vue'),
        meta: {
          icon: 'lucide:tags',
          title: '数据标签',
        },
      },
    ],
  },
];

export default routes;
