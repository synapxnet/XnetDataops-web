<script setup lang="ts">
import type { MTPProjectItem } from '../typing';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  VbenIcon,
} from '@vben-core/shadcn-ui';

interface Props {
  items: MTPProjectItem[];
  title: string;
}

defineOptions({
  name: 'MTPProject',
});

withDefaults(defineProps<Props>(), {
  items: () => [],
});

const emit = defineEmits(['click']);
</script>

<template>
  <Card>
    <CardHeader class="border-border border-b py-4">
      <CardTitle class="text-lg">{{ title }}</CardTitle>
    </CardHeader>
    <CardContent class="p-0">
      <template v-for="(item, index) in items" :key="item.title">
        <div
          :class="{
            'border-border border-t': index !== 0,
            'pb-4': index !== items.length - 1,
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
