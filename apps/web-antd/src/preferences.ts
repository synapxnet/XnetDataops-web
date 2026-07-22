import { defineOverridesPreferences } from '@vben/preferences';

import logo from '../../../packages/effects/layouts/src/logo/Synap-Xnet.png';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  app: {
    defaultAvatar: logo,
    defaultHomePath: '/dashboard/overview',
    enableCheckUpdates: false,
    name: import.meta.env.VITE_APP_TITLE,
  },
  copyright: {
    companyName: 'SynapXnet',
    companySiteLink: 'https://openxnet.synapxnet.com',
    date: '2026',
    enable: true,
  },
  logo: {
    enable: true,
    source: logo,
  },
});
