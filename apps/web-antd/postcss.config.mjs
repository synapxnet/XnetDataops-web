/* Copyright (C) 2026 Synapxnet. All rights reserved.
 * Synapxnet Proprietary and Confidential. Unauthorized copying, distribution or use is forbidden.
 * 从依赖所属工作区解析PostCSS插件。Resolve PostCSS plugins from their owning workspace.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
 * __version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
 * __maintainer__: maoyo | __email__: synapxnet@gmail.com
 */
import { createRequire } from 'node:module';
import config from '@vben/tailwind-config/postcss';

const requirePlugin = createRequire(import.meta.resolve('@vben/tailwind-config/postcss'));
/** 保持既有插件顺序与选项，修复pnpm隔离依赖解析。Preserve plugin order/options and resolve isolated pnpm dependencies. */
function resolvePlugin([name, options]) { return [requirePlugin.resolve(name), options]; }
export default { ...config, plugins: Object.fromEntries(Object.entries(config.plugins).map(resolvePlugin)) };
