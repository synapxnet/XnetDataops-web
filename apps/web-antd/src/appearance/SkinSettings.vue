<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：统一业务页面与外观。Purpose: Provide consistent business pages and appearance.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
-->
<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { preferences } from '@vben/preferences';
import {
  Alert,
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  InputNumber,
  Segmented,
  Space,
  message,
} from 'ant-design-vue';
import {
  activeSkin,
  applySkin,
  savedSkins,
  saveSkin,
  skinPanelOpen,
} from './skin';
import {
  DEFAULT_SKIN,
  MAX_IMAGE_BYTES,
  MAX_SKIN_BYTES,
  parseSkin,
  serializeSkin,
  type Skin,
} from './skin-schema';
const draft = reactive<Skin>({ ...activeSkin.value });
const original = ref<Skin>({ ...activeSkin.value });
const error = ref('');
const importedFile = ref<HTMLInputElement>();
const backgroundFile = ref<HTMLInputElement>();
// 每次打开从当前外观生成独立草稿。 Start an isolated draft from the current appearance on each opening.
watch(skinPanelOpen, (open) => {
  if (open) {
    const current = {
      ...activeSkin.value,
      mode:
        preferences.theme.mode === 'auto'
          ? ('system' as const)
          : preferences.theme.mode,
      accent: ['#187bbd', '#60bcec'].includes(preferences.theme.colorPrimary)
        ? DEFAULT_SKIN.accent
        : preferences.theme.colorPrimary,
    };
    Object.assign(draft, current);
    original.value = { ...current };
    error.value = '';
  }
});
/** 预览仅使用经校验字段并保留可恢复草稿。 Preview validated fields while retaining a reversible draft. */
function preview() {
  try {
    applySkin({ ...draft });
    error.value = '';
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '外观参数无效';
  }
}
/** 保存成功后才关闭设置，失败保留草稿。 Close settings only after a successful save and retain the draft on failure. */
function save() {
  try {
    saveSkin({ ...draft });
    skinPanelOpen.value = false;
    message.success('皮肤已保存');
  } catch {
    error.value = '保存失败，请缩小背景图片或检查浏览器存储空间';
  }
}
/** 关闭时恢复进入设置前的外观。 Restore the prior appearance when cancelling the draft. */
function cancel() {
  applySkin(original.value);
  skinPanelOpen.value = false;
}
/** 读取受限本地图片后应用预览。 Read a bounded local image and preview it. */
async function uploadBackground(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (
    file.size > MAX_IMAGE_BYTES ||
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
  ) {
    error.value = '请选择2MB以内的PNG、JPEG或WebP图片';
    return;
  }
  const reader = new FileReader();
  // 文件读取完成后验证data URL并预览。 Validate the completed data URL before applying the preview.
  reader.onload = () => {
    draft.backgroundImage = String(reader.result ?? '');
    preview();
  };
  // 读取失败保留当前草稿。 Retain the current draft if file reading fails.
  reader.onerror = () => {
    error.value = '背景图片读取失败';
  };
  reader.readAsDataURL(file);
  (event.target as HTMLInputElement).value = '';
}
/** 有界读取JSON文件并验证所有外观字段。 Read a bounded JSON file and validate every appearance field. */
async function importSkin(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    if (file.size > MAX_SKIN_BYTES) throw new Error('皮肤文件不能超过3MB');
    Object.assign(draft, parseSkin(await file.text()));
    preview();
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '皮肤文件导入失败';
  }
  (event.target as HTMLInputElement).value = '';
}
/** 导出当前草稿为验证过的JSON并释放临时URL。 Download validated draft JSON and release the temporary object URL. */
function exportSkin() {
  try {
    const url = URL.createObjectURL(
      new Blob([serializeSkin({ ...draft })], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'synapxnet-dataops-skin.json';
    link.click();
    URL.revokeObjectURL(url);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '无法导出皮肤';
  }
}
/** 在设置面板预览默认外观，允许取消恢复。 Preview the brand default while retaining the ability to cancel. */
function restore() {
  Object.assign(draft, DEFAULT_SKIN);
  preview();
}
</script>
<template>
  <Drawer
    :open="skinPanelOpen"
    title="外观与皮肤"
    width="400"
    class="dataops-skin-drawer"
    :closable="false"
    :mask-closable="false"
    @close="cancel"
  >
    <p class="skin-intro">
      让工作空间呈现你喜欢的样子。调整会实时预览，保存后在此设备使用。
    </p>
    <Alert v-if="error" :message="error" type="warning" show-icon />
    <Form layout="vertical">
      <FormItem v-if="savedSkins.length" label="本机已保存"
        ><Space wrap
          ><Button
            v-for="skin in savedSkins"
            :key="skin.name"
            @click="
              Object.assign(draft, skin);
              preview();
            "
            >{{ skin.name }}</Button
          ></Space
        ></FormItem
      >
      <FormItem label="皮肤名称"
        ><Input v-model:value="draft.name" :maxlength="60" @change="preview"
      /></FormItem>
      <FormItem label="主色"
        ><div class="skin-color">
          <input
            v-model="draft.accent"
            type="color"
            aria-label="选择皮肤主色"
            @input="preview"
          /><Input
            v-model:value="draft.accent"
            :maxlength="7"
            aria-label="主色HEX"
            @change="preview"
          /></div
      ></FormItem>
      <FormItem label="明暗"
        ><Segmented
          v-model:value="draft.mode"
          :options="[
            { label: '明亮', value: 'light' },
            { label: '深色', value: 'dark' },
            { label: '跟随系统', value: 'system' },
          ]"
          @change="preview"
      /></FormItem>
      <FormItem label="界面密度"
        ><Segmented
          v-model:value="draft.density"
          :options="[
            { label: '舒适', value: 'comfortable' },
            { label: '紧凑', value: 'compact' },
          ]"
          @change="preview"
      /></FormItem>
      <FormItem label="圆角"
        ><InputNumber
          v-model:value="draft.radius"
          :min="0"
          :max="24"
          addon-after="px"
          @change="preview"
      /></FormItem>
      <FormItem label="背景强度"
        ><InputNumber
          v-model:value="draft.backgroundOpacity"
          :min="0"
          :max="0.4"
          :step="0.05"
          @change="preview"
      /></FormItem>
      <FormItem label="背景图片"
        ><Space wrap
          ><Button @click="backgroundFile?.click()">选择本地图片</Button
          ><Button
            v-if="draft.backgroundImage"
            @click="
              draft.backgroundImage = '';
              preview();
            "
            >移除背景</Button
          ></Space
        >
        <p class="skin-hint">PNG、JPEG或WebP，最大2MB。</p>
        <img
          v-if="draft.backgroundImage"
          :src="draft.backgroundImage"
          alt="当前背景预览"
          class="skin-preview"
      /></FormItem>
      <input
        ref="backgroundFile"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        @change="uploadBackground"
      />
      <input
        ref="importedFile"
        type="file"
        accept=".json,application/json"
        hidden
        @change="importSkin"
      />
      <Space wrap
        ><Button @click="importedFile?.click()">导入JSON</Button
        ><Button @click="exportSkin">导出JSON</Button
        ><Button @click="restore">恢复默认</Button></Space
      >
    </Form>
    <template #footer
      ><Space
        ><Button @click="cancel">取消</Button
        ><Button type="primary" @click="save">保存皮肤</Button></Space
      ></template
    >
  </Drawer>
</template>
<style scoped>
.skin-intro,
.skin-hint {
  color: hsl(var(--muted-foreground));
  font-size: 12px;
  line-height: 1.7;
}
.skin-color {
  display: flex;
  gap: 12px;
}
.skin-color input[type='color'] {
  width: 48px;
  height: 34px;
  padding: 2px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: transparent;
}
.skin-preview {
  width: 100%;
  max-height: 150px;
  object-fit: cover;
  margin-top: 12px;
  border-radius: 12px;
}
</style>
