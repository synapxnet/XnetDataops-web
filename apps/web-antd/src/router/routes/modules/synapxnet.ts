import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:panels-top-left',
      order: 9998,
      title: 'SynapXnet 项目',
    },
    name: 'SynapXnetProject',
    path: '/synapxnet',
    children: [
      {
        name: 'OpenXnet',
        path: '/synapxnet/openxnet',
        component: () => import('#/views/_core/about/external.vue'),
        meta: {
          icon: 'lucide:book-open-text',
          externalResource: 'https://openxnet.synapxnet.com',
          title: 'OpenXnet 开源社区',
        },
      },
      {
        name: 'XnetDataopsWebRepository',
        path: '/synapxnet/frontend',
        component: () => import('#/views/_core/about/external.vue'),
        meta: {
          icon: 'mdi:github',
          externalResource: 'https://github.com/synapxnet/XnetDataops-web',
          title: '前端仓库',
        },
      },
      {
        name: 'XnetDataopsRepository',
        path: '/synapxnet/backend',
        component: () => import('#/views/_core/about/external.vue'),
        meta: {
          icon: 'mdi:github',
          externalResource: 'https://github.com/synapxnet/XnetDataops',
          title: '后端仓库',
        },
      },
    ],
  },
  {
    name: 'SynapXnetAbout',
    path: '/about',
    component: () => import('#/views/_core/about/index.vue'),
    meta: {
      icon: 'lucide:badge-info',
      order: 9999,
      title: '关于 XnetDataops',
    },
  },
];

export default routes;
