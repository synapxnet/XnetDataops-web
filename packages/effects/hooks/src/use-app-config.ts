import type {
  ApplicationConfig,
  VbenAdminProAppConfigRaw,
} from '@vben/types/global';

/**
 * 由 vite-inject-app-config 注入的全局配置
 */
export function useAppConfig(
  env: Record<string, any>,
  isProduction: boolean,
): ApplicationConfig {
  // 生产环境下，直接使用 window._VBEN_ADMIN_PRO_APP_CONF_ 全局变量
  const config = isProduction
    ? { ...env, ...window._VBEN_ADMIN_PRO_APP_CONF_ }
    : (env as VbenAdminProAppConfigRaw);

  const {
    VITE_GLOB_API_URL,
    VITE_DSM_API_URL,
    VITE_DIM_API_URL,
    VITE_DDV_API_URL,
    VITE_TSK_API_URL,
    VITE_DQM_API_URL,
    VITE_DGV_API_URL,
    VITE_DAS_API_URL,
    VITE_DAP_API_URL,
    VITE_DMS_API_URL,
    VITE_DOB_API_URL,
    VITE_DAU_API_URL,
  } = config;

  return {
    apiURL: VITE_GLOB_API_URL,
    dsmApiURL: VITE_DSM_API_URL,
    dimApiURL: VITE_DIM_API_URL,
    ddvApiURL: VITE_DDV_API_URL,
    tskApiURL: VITE_TSK_API_URL,
    dqmApiURL: VITE_DQM_API_URL,
    dgvApiURL: VITE_DGV_API_URL,
    dasApiURL: VITE_DAS_API_URL,
    dapApiURL: VITE_DAP_API_URL,
    dmsApiURL: VITE_DMS_API_URL,
    dobApiURL: VITE_DOB_API_URL,
    dauApiURL: VITE_DAU_API_URL,
  };
}
