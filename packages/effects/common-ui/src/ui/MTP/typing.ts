import type { Component } from 'vue';

interface MTPProjectItem {
  color?: string;
  content: string;
  date: string;
  group: string;
  icon: Component | string;
  title: string;
  url?: string;
}
export type { MTPProjectItem };
