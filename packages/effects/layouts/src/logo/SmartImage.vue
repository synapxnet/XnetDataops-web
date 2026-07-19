<!-- SmartImage.vue -->
<template>
    <div class="image-wrapper">
      <img
        :src="effectiveSrc"
        :alt="alt"
        :width="width"
        :height="height"
        :class="rootClass"
        :style="computedStyle"
        @error="handleError"
      />
      <div v-if="showLoading" class="loading-overlay">
        <slot name="loading">
          <Spinner size="sm" />
        </slot>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref } from 'vue';
  import defaultLogo from './Synap-Xnet.png';
  interface Props {
    src?: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    lazy?: boolean;
    aspectRatio?: string;
    radius?: string;
    responsive?: boolean;
    defaultSrc?: string;
  }
  
  const props = withDefaults(defineProps<Props>(), {
    src: '',
    alt: 'Synap Xnet',
    width: 'auto',
    height: 'auto',
    lazy: true,
    aspectRatio: '1/1',
    radius: '0',
    responsive: true,
    defaultSrc: defaultLogo
  });
  
  const emit = defineEmits(['error', 'load']);
  
  const hasError = ref(false);
  const showLoading = ref(true);
  
  // 计算最终图片源
  const effectiveSrc = computed(() => {
    if (hasError.value) return props.defaultSrc;
    return props.src || props.defaultSrc;
  });
  
  // 样式计算
  const computedStyle = computed(() => ({
    borderRadius: props.radius,
    aspectRatio: props.aspectRatio
  }));
  
  // 类名计算
  const rootClass = computed(() => ({
    'responsive-image': props.responsive,
    'has-error': hasError.value
  }));
  
  // 错误处理
  const handleError = (e: Event) => {
    hasError.value = true;
    showLoading.value = false;
    emit('error', e);
  };
  
  // 图片加载完成处理
  const handleLoad = () => {
    showLoading.value = false;
    emit('load');
  };
  </script>
  
  <style scoped>
  .image-wrapper {
    position: relative;
    display: inline-block;
  }
  
  .responsive-image {
    max-width: 100%;
    height: auto;
    object-fit: cover;
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.8);
  }
  
  .has-error {
    filter: grayscale(1);
    opacity: 0.5;
  }
  </style>
  