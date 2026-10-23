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
        name: 'DataGovernanceWorkbench',
        path: '/DGV/governance',
        // 加载原生只读工作台，保留原有菜单。 Load the read-only native workbench while preserving existing routes.
        component: () => import('#/views/DGV/governance/index.vue'),
        meta: { icon: 'lucide:workflow', title: '治理工作台' },
      },
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
