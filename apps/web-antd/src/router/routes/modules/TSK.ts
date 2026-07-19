import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:workflow',
      order: 5,
      title: '任务调度',
    },
    name: 'TSK',
    path: '/TSK',
    children: [
      {
        name: 'WorkflowList',
        path: '/TSK/workflow/list',
        component: () => import('#/views/TSK/workflow/list.vue'),
        meta: {
          icon: 'lucide:git-branch',
          title: '工作流列表',
        },
      },
      {
        name: 'WorkflowDesign',
        path: '/TSK/workflow/design/:id',
        component: () => import('#/views/TSK/workflow/design.vue'),
        meta: {
          icon: 'lucide:pen-tool',
          title: 'DAG编排',
          hideInMenu: true,
        },
      },
      {
        name: 'TaskInstanceList',
        path: '/TSK/instance/list',
        component: () => import('#/views/TSK/instance/list.vue'),
        meta: {
          icon: 'lucide:play-circle',
          title: '运行实例',
        },
      },
    ],
  },
];

export default routes;
