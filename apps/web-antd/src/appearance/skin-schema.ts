/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：统一业务页面与外观。Purpose: Provide consistent business pages and appearance.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/
export interface Skin {
  schema: 'synapxnet.skin';
  version: 1;
  name: string;
  accent: string;
  mode: 'dark' | 'light' | 'system';
  backgroundImage: string;
  backgroundOpacity: number;
  radius: number;
  density: 'comfortable' | 'compact';
}
export const DEFAULT_SKIN: Skin = {
  schema: 'synapxnet.skin',
  version: 1,
  name: 'SynapXnet 蓝青',
  accent: '#187bbd',
  mode: 'light',
  backgroundImage: '',
  backgroundOpacity: 0.15,
  radius: 12,
  density: 'comfortable',
};
export const MAX_SKIN_BYTES = 3 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
/** 验证跨平台皮肤白名单与图像字节边界。 Validate the cross-platform skin allowlist and decoded image byte bounds. */
export function validateSkin(value: unknown): Skin {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('皮肤文件格式无效');
  let source = value as Record<string, unknown>;
  if (source.schemaVersion === '1.0.0') {
    const { schemaVersion, primary, ...rest } = source;
    source = {
      ...rest,
      schema: 'synapxnet.skin',
      version: 1,
      accent: primary,
      backgroundOpacity: 0.15,
    };
  }
  const allowed = [
    'schema',
    'version',
    'name',
    'accent',
    'mode',
    'backgroundImage',
    'backgroundOpacity',
    'radius',
    'density',
  ];
  if (
    Object.keys(source).some((key) => !allowed.includes(key)) ||
    source.schema !== 'synapxnet.skin' ||
    source.version !== 1
  )
    throw new Error('不支持的皮肤版本或字段');
  if (
    typeof source.name !== 'string' ||
    !source.name.trim() ||
    source.name.length > 60
  )
    throw new Error('皮肤名称应为1至60个字符');
  if (
    typeof source.accent !== 'string' ||
    !/^#[\da-f]{6}$/i.test(source.accent)
  )
    throw new Error('主色需要六位HEX颜色');
  if (!['light', 'dark', 'system'].includes(String(source.mode)))
    throw new Error('明暗模式无效');
  if (!['comfortable', 'compact'].includes(String(source.density)))
    throw new Error('界面密度无效');
  if (
    typeof source.radius !== 'number' ||
    !Number.isFinite(source.radius) ||
    source.radius < 0 ||
    source.radius > 24
  )
    throw new Error('圆角应为0至24像素');
  if (
    typeof source.backgroundOpacity !== 'number' ||
    !Number.isFinite(source.backgroundOpacity) ||
    source.backgroundOpacity < 0 ||
    source.backgroundOpacity > 0.4
  )
    throw new Error('背景透明度应为0至0.4');
  const image = source.backgroundImage;
  if (
    typeof image !== 'string' ||
    (image &&
      !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
        image,
      ))
  )
    throw new Error('背景仅支持本地PNG、JPEG或WebP图片');
  if (image) {
    const encoded = image.slice(image.indexOf(',') + 1);
    const bytes =
      (encoded.length * 3) / 4 -
      (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0);
    if (encoded.length % 4 !== 0 || bytes > MAX_IMAGE_BYTES)
      throw new Error('背景图片不能超过2MB');
  }
  return {
    schema: 'synapxnet.skin',
    version: 1,
    name: source.name.trim(),
    accent: source.accent.toLowerCase(),
    mode: source.mode as Skin['mode'],
    backgroundImage: image,
    backgroundOpacity: source.backgroundOpacity,
    radius: source.radius,
    density: source.density as Skin['density'],
  };
}
/** 有界解析JSON并执行完整皮肤验证。 Parse bounded JSON input and validate the complete skin. */
export function parseSkin(text: string): Skin {
  if (new TextEncoder().encode(text).length > MAX_SKIN_BYTES)
    throw new Error('皮肤文件不能超过3MB');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('无法读取皮肤JSON文件');
  }
  return validateSkin(value);
}
/** 导出跨平台格式且不包含业务资料。 Export the shared platform format without business records. */
export function serializeSkin(value: Skin) {
  return JSON.stringify(validateSkin(value), null, 2);
}
