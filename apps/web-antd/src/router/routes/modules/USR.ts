import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['ADMIN'],
      icon: 'lucide:users',
      order: 8,
      title: '系统管理',
    },
    name: 'USR',
    path: '/USR',
    children: [
      {
        name: 'UserList',
        path: '/USR/user/list',
        component: () => import('#/views/USR/user/list.vue'),
        meta: {
          icon: 'lucide:user',
          title: '用户管理',
        },
      },
      {
        name: 'RoleList',
        path: '/USR/role/list',
        component: () => import('#/views/USR/role/list.vue'),
        meta: {
          icon: 'lucide:shield-check',
          title: '角色管理',
        },
      },
    ],
  },
];

export default routes;
