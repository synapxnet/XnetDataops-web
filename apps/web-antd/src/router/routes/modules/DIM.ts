import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:arrow-left-right',
      order: 3,
      title: '数据集成',
    },
    name: 'DIM',
    path: '/DIM',
    children: [
      {
        name: 'SyncTaskList',
        path: '/DIM/task/list',
        component: () => import('#/views/DIM/task/list.vue'),
        meta: {
          icon: 'lucide:list',
          title: '同步任务',
        },
      },
      {
        name: 'SyncTaskCreate',
        path: '/DIM/task/create',
        component: () => import('#/views/DIM/task/create.vue'),
        meta: {
          icon: 'lucide:plus-circle',
          title: '创建任务',
        },
      },
      {
        name: 'SyncTaskLog',
        path: '/DIM/task/log/:id',
        component: () => import('#/views/DIM/task/log.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '执行日志',
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
