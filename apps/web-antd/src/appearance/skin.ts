/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：统一业务页面与外观。Purpose: Provide consistent business pages and appearance.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/
import { ref, watch } from 'vue';
import { usePreferredDark } from '@vueuse/core';
import { preferences, updatePreferences } from '@vben/preferences';
import {
  DEFAULT_SKIN,
  parseSkin,
  serializeSkin,
  validateSkin,
  type Skin,
} from './skin-schema';
const STORAGE_KEY = 'synapxnet:dataops:skin:v1';
const LIBRARY_KEY = 'synapxnet:dataops:skins:v1';
const systemDark = usePreferredDark();
export const skinPanelOpen = ref(false);
export const savedSkins = ref<Skin[]>([]);
export const activeSkin = ref<Skin>({ ...DEFAULT_SKIN });
/** 应用经验证的皮肤，复用平台主题并设置受限变量。 Apply validated skin through platform preferences and bounded CSS variables. */
export function applySkin(input: Skin, persist = false) {
  const skin = validateSkin(input);
  activeSkin.value = skin;
  updatePreferences(
    {
      theme: {
        colorPrimary:
          skin.accent === DEFAULT_SKIN.accent &&
          (skin.mode === 'dark' || (skin.mode === 'system' && systemDark.value))
            ? '#60bcec'
            : skin.accent,
        mode: skin.mode === 'system' ? 'auto' : skin.mode,
        radius: String(skin.radius / 16),
        builtinType: 'custom',
      },
      app: { compact: skin.density === 'compact' },
    },
    persist,
  );
  const root = document.documentElement;
  root.style.setProperty('--dataops-radius', skin.radius + 'px');
  root.style.setProperty(
    '--dataops-space',
    skin.density === 'compact' ? '16px' : '24px',
  );
  root.style.setProperty(
    '--dataops-background-image',
    skin.backgroundImage ? 'url("' + skin.backgroundImage + '")' : 'none',
  );
  root.style.setProperty(
    '--dataops-background-opacity',
    String(skin.backgroundOpacity),
  );
  root.dataset.dataopsDensity = skin.density;
}
/** 初始化已保存皮肤；缺省尊重平台原有颜色与明暗偏好。 Initialize saved appearance while preserving existing platform preferences when no custom skin exists. */
export function initializeSkin() {
  try {
    const library = JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? 'null');
    if (library && Array.isArray(library.skins)) {
      savedSkins.value = library.skins.slice(-10).map(validateSkin);
      const selected = savedSkins.value.find(
        (skin) => skin.name === library.active,
      );
      if (selected) {
        applySkin(selected);
        return;
      }
    }
    const collection = JSON.parse(
      localStorage.getItem(STORAGE_KEY + ':collection') ?? '[]',
    );
    savedSkins.value = Array.isArray(collection)
      ? collection.map(validateSkin)
      : [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      applySkin(parseSkin(stored));
      return;
    }
  } catch {
    /* 无效本地文件不执行。 Ignore invalid local appearance data. */
  }
  activeSkin.value = {
    ...DEFAULT_SKIN,
    accent: /^#[\da-f]{6}$/i.test(preferences.theme.colorPrimary)
      ? preferences.theme.colorPrimary
      : DEFAULT_SKIN.accent,
    mode:
      preferences.theme.mode === 'dark'
        ? 'dark'
        : preferences.theme.mode === 'auto'
          ? 'system'
          : 'light',
  };
  document.documentElement.style.setProperty('--dataops-radius', '12px');
}
/** 保存当前外观，并将存储容量失败返回给用户。 Persist appearance and propagate storage failures to the caller. */
export function saveSkin(input: Skin) {
  serializeSkin(input);
  const next = [
    ...savedSkins.value.filter((item) => item.name !== input.name),
    validateSkin(input),
  ].slice(-10);
  localStorage.setItem(
    LIBRARY_KEY,
    JSON.stringify({ active: input.name, skins: next }),
  );
  savedSkins.value = next;
  applySkin(input, true);
}

// 保持品牌蓝在明暗变化后的可读性，自定义颜色按用户选择保留。 Keep default brand blue readable across mode changes while preserving custom colors.
watch([() => preferences.theme.mode, systemDark], () => {
  if (['#187bbd', '#60bcec'].includes(preferences.theme.colorPrimary)) {
    const dark =
      preferences.theme.mode === 'dark' ||
      (preferences.theme.mode === 'auto' && systemDark.value);
    updatePreferences(
      { theme: { colorPrimary: dark ? '#60bcec' : '#187bbd' } },
      !skinPanelOpen.value,
    );
  }
});
