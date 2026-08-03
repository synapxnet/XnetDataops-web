import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    children: [
      {
        component: () => import('#/views/AGENT/incident/data-evidence.vue'),
        meta: { hideInMenu: true, title: '数据证据链' },
        name: 'AgentDataEvidence',
        path: '/agent/incidents/:incidentId/data-evidence',
      },
    ],
    meta: { hideInMenu: true, title: 'Agent Trace' },
    name: 'AgentTrace',
    path: '/agent',
  },
];

export default routes;
