import type { RouteMeta as IRouteMeta } from '@vben-core/typings';

import 'vue-router';

declare module 'vue-router' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouteMeta extends IRouteMeta {}
}

export interface VbenAdminProAppConfigRaw {
  VITE_GLOB_API_URL: string;
  VITE_DSM_API_URL: string;
  VITE_DIM_API_URL: string;
  VITE_DDV_API_URL: string;
  VITE_TSK_API_URL: string;
  VITE_DQM_API_URL: string;
  VITE_DGV_API_URL: string;
  VITE_DAS_API_URL: string;
  VITE_DAP_API_URL: string;
  VITE_DMS_API_URL: string;
  VITE_DOB_API_URL: string;
  VITE_DAU_API_URL: string;
}

export interface ApplicationConfig {
  apiURL: string;
  dsmApiURL: string;
  dimApiURL: string;
  ddvApiURL: string;
  tskApiURL: string;
  dqmApiURL: string;
  dgvApiURL: string;
  dasApiURL: string;
  dapApiURL: string;
  dmsApiURL: string;
  dobApiURL: string;
  dauApiURL: string;
}

declare global {
  interface Window {
    _VBEN_ADMIN_PRO_APP_CONF_: VbenAdminProAppConfigRaw;
  }
}
