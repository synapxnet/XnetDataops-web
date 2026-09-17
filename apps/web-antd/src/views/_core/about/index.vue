<script lang="ts" setup>
import DataPage from '#/components/data-page/index.vue';
defineOptions({ name: 'SynapXnetAbout' });

const capabilities = [
  ['全链路 DataOps', '覆盖数据接入、开发、调度、质量、治理、服务与审计。'],
  ['企业多租户', '以租户、用户、角色和权限边界支撑多团队数据协作。'],
  ['前后端分离', '独立 Web 控制台与十二个业务服务可按企业架构灵活组合。'],
  ['持续演进', '围绕连接器、治理规则、可观测性和数据服务持续维护更新。'],
];

const links = [
  ['在线体验', 'http://www.xnetdataops.synapxnet.cn'],
  ['前端仓库', 'https://github.com/synapxnet/XnetDataops-web'],
  ['后端仓库', 'https://github.com/synapxnet/XnetDataops'],
  ['OpenXnet', 'https://openxnet.synapxnet.com'],
];
</script>

<template>
  <DataPage
    title="关于 XnetDataOps"
    description="连接企业数据与物理观测，为整个 SynapXnet 提供可信数据。"
  >
    <main class="mx-auto max-w-6xl px-2 py-3">
      <section>
        <h2 class="text-foreground text-lg font-semibold">平台优势</h2>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <article
            v-for="([title, description], index) in capabilities"
            :key="index"
            class="border-border bg-card rounded-md border p-5"
          >
            <h3 class="text-foreground text-sm font-semibold">{{ title }}</h3>
            <p class="text-muted-foreground mt-2 text-sm leading-6">
              {{ description }}
            </p>
          </article>
        </div>
      </section>

      <section class="border-border mt-10 border-t pt-8">
        <h2 class="text-foreground text-lg font-semibold">项目链接</h2>
        <div class="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          <a
            v-for="([label, href], index) in links"
            :key="index"
            :href="href"
            class="text-primary hover:text-primary/80 text-sm font-medium"
            rel="noreferrer"
            target="_blank"
          >
            {{ label }} ↗
          </a>
        </div>
      </section>

      <section class="border-border mt-10 border-t pt-8">
        <h2 class="text-foreground text-lg font-semibold">开源与框架</h2>
        <p class="text-muted-foreground mt-3 max-w-4xl text-sm leading-6">
          XnetDataops Web 基于 MIT License 开源，前端采用
          <a
            class="text-primary hover:text-primary/80 font-medium"
            href="https://github.com/vbenjs/vue-vben-admin"
            rel="noreferrer"
            target="_blank"
          >
            Vue Vben Admin
          </a>
          框架构建，并依法保留上游项目的版权与许可声明。
        </p>
        <p class="text-muted-foreground mt-3 text-sm">
          Copyright © 2026 SynapXnet
        </p>
      </section>
    </main>
  </DataPage>
</template>
