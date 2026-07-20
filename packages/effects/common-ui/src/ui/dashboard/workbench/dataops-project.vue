<script setup lang="ts">
import { ref } from 'vue';
import type { DataopsProjectItem } from '../typing';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  VbenIcon,
} from '@vben-core/shadcn-ui';

interface Props {
  items: DataopsProjectItem[];
  title: string;
}

defineOptions({
  name: 'DataopsProject',
});

withDefaults(defineProps<Props>(), {
  items: () => [],
});

const emit = defineEmits(['click']);

// 折叠状态
const isCollapsed = ref(false);
// 切换折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<template>
  <Card>
    <CardHeader class="flex items-center justify-between border-b border-border py-4">
      <CardTitle class="text-lg">{{ title }}</CardTitle>
      <button
        class="text-muted-foreground hover:text-foreground transition-colors"
        @click.stop="toggleCollapse"
      >
        {{ isCollapsed ? '展开' : '折叠' }}
      </button>
    </CardHeader>
    <CardContent v-if="!isCollapsed" class="p-0">
      <template v-for="(item, index) in items" :key="item.title">
        <div
          :class="{
            'border-t border-border': index !== 0, // 第一个项目不加顶部边框
            'pb-4': index !== items.length - 1,    // 最后一项不加底部间距
          }"
          class="group cursor-pointer p-4 pt-4 transition-all hover:shadow-xl"
        >
          <div class="flex items-center">
            <VbenIcon
              :color="item.color"
              :icon="item.icon"
              class="size-8 transition-all duration-300 group-hover:scale-110"
              @click="emit('click', item)"
            />
            <span class="ml-4 text-lg font-medium">{{ item.title }}</span>
          </div>
          <div class="text-foreground/80 mt-4 flex h-10">
            {{ item.content }}
          </div>
          <div class="text-foreground/80 flex justify-between">
            <span>{{ item.group }}</span>
            <span>{{ item.date }}</span>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>