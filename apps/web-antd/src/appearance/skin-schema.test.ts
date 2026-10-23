/* Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：外观、请求和图的回归测试。Purpose: Regression tests for skins, requests and graphs.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com */
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SKIN,
  parseSkin,
  serializeSkin,
  validateSkin,
} from './skin-schema';
/** 验证跨平台纯数据互导及边界。 Verify cross-platform pure-data exchange and input boundaries. */
describe('SynapXnet shared skin', () => {
  /** 同一皮肤导出后保留所有字段。 Preserve every field through a round trip. */
  it('round trips the shared schema', () => {
    const skin = {
      ...DEFAULT_SKIN,
      mode: 'system' as const,
      radius: 0,
      density: 'compact' as const,
      backgroundOpacity: 0.4,
    };
    expect(parseSkin(serializeSkin(skin))).toEqual(skin);
  });
  /** 接受历史DataOps皮肤并转换为统一格式。 Adapt the early DataOps skin into the shared format. */
  it('adapts the earlier DataOps schema', () => {
    const { schema, version, accent, backgroundOpacity, ...rest } =
      DEFAULT_SKIN;
    expect(
      validateSkin({ ...rest, schemaVersion: '1.0.0', primary: accent }),
    ).toEqual(DEFAULT_SKIN);
  });
  /** 拒绝外部和可执行图像来源。 Reject remote and executable image sources. */
  it.each([
    'https://example.invalid/image.png',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'javascript:alert(1)',
    'url(test)',
  ])('rejects unsafe background %s', (backgroundImage) => {
    expect(() => validateSkin({ ...DEFAULT_SKIN, backgroundImage })).toThrow();
  });
  /** 拒绝任意CSS或未知键进入主题。 Reject arbitrary CSS and unknown keys. */
  it('rejects unexpected executable style fields', () => {
    expect(() => validateSkin({ ...DEFAULT_SKIN, css: 'body{}' })).toThrow();
  });
  /** 边界数字必须有限且位于契约范围。 Numeric boundaries must be finite and within contract ranges. */
  it.each([
    { radius: 25 },
    { radius: -1 },
    { backgroundOpacity: 0.5 },
    { backgroundOpacity: NaN },
    { accent: '#fff' },
    { mode: 'auto' },
    { version: 2 },
  ])('rejects invalid values %o', (change) => {
    expect(() => validateSkin({ ...DEFAULT_SKIN, ...change })).toThrow();
  });
  /** 图片预算按解码字节计算。 Enforce image budgets using decoded bytes. */
  it('rejects an image above two megabytes', () => {
    expect(() =>
      validateSkin({
        ...DEFAULT_SKIN,
        backgroundImage: 'data:image/png;base64,' + 'A'.repeat(2796204),
      }),
    ).toThrow();
  });
  /** 拒绝超大JSON和损坏JSON。 Reject oversized or malformed JSON documents. */
  it('rejects malformed and oversized imports', () => {
    expect(() => parseSkin('{')).toThrow();
    expect(() => parseSkin(' '.repeat(3 * 1024 * 1024 + 1))).toThrow();
  });
});
