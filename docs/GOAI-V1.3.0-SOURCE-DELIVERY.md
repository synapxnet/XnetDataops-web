<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
决赛源码交付 / Finals source delivery.
Author: maoyo | Department: 研发部 | Date: 2026-09-17 | Version: 1.3.0
Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
-->

# XnetDataOps GOAI V1.3.0 前端源码交付

根产品与 `apps/web-antd` 版本为 1.3.0。框架 workspace 包保留原版本，皮肤与接口的 schema 保留兼容标识。后端位于 XnetDataops 的 GOAI-Competition 分支。

## 来源与内容

基于 GitHub GOAI `277b4f4d2d6fcd5374f595c0f6d319e38a4b1cea`，整合 `goai-finals-dataops/frontend` 的实际发布源码。包括 2026-09-17 统一品牌登录页、深浅主题、皮肤导入导出、驻场 Agent 聊天/任务/配置面板、治理工作台、血缘与质量证据、DAG 编辑校验、请求失败状态和逐页视觉修订。未用复赛旧页面覆盖最新功能。

驻场 UI 调用同源 `/api/resident/v1`，模型地址与 API Key 保存在驻场服务端，浏览器只读取是否已配置。服务实现固定引用 [OpenXnet c841ef84](https://github.com/synapxnet/OpenXnet/tree/c841ef841da8477fc312e27cd390aecac8ed2d7e/services/platform-resident-agent)。调用身份由既有平台登录令牌决定，界面本身不赋予跨平台写权限。

## 构建

使用 Node.js 20.10+、pnpm **9.15.7**。先执行 `pnpm install --frozen-lockfile`，工作区已有 postinstall 会为内部包生成开发 stub；然后在仓库根目录运行 `pnpm build:antd`，由 Turbo 先构建依赖，再构建产品；不要从缺少内部 dist 的全新目录直接运行 Vite。正式制品来自 `apps/web-antd/dist`。本次提交不包含 `node_modules`、dist、缓存、逐页截图、录屏或真实用户配置。

依赖安装禁止生命周期脚本时，需显式执行可信内部 workspace 的 `pnpm -r --if-present run stub` 后再构建。使用 Tailwind 插件的自定义环境必须保证既有 `@vben/tailwind-config` 依赖可被解析。本轮 Windows 环境存在全局 pnpm 11 与工程 pnpm 9 的冲突，采用固定 pnpm 9.15.7 离线安装（不执行生命周期脚本），随后直接调用当前仓库 unbuild 生成 node-utils/vite-config stub，正式编译 tailwind-config、shared、design 与其余 core 构建依赖，再在 web-antd 调用 Vite。所有产物均由本次副本源码生成，未复制旧 dist。

## 验证与边界

2026-09-17 在独立源码副本使用锁定依赖运行七组前端测试，**47/47 通过**：登录会话 2、皮肤 16、请求状态 6、血缘布局 2、治理展示 14、DAG 校验 4、DAG 页面设计 3。同一副本的内部依赖与 Vite 生产构建通过，生成 web-antd 静态资源；构建保留既有 Browserslist 数据陈旧和大 chunk 提醒。全量 vue-tsc 在原发布工作树已有类型与未使用符号问题，本轮未宣称完整类型检查通过。本轮不会连接线上发送验证码、执行写入、重新部署或重新演示 AgentTeams 任务。2026-09-17 线上登录页发布回执确认统一布局和入口可达，不能替代所有业务功能的真实端到端验收。

原仓库 `deploy/` 包含早期 MLOps 通用示例，不是当前 DataOps 线上部署拓扑，不能直接拿它覆盖线上。部署当前前端时应将本次 dist 放入既有 DataOps Web 容器并保留受保护的十二服务路由、驻场路由和治理工作台精确前缀。服务地址、内部凭据、工作空间授权映射由部署环境配置。后端交付说明列出对应配置与执行边界。

同一前端可以展示 Fixture、Live 或回放数据；以来源标识、真实 Run、审批与独立验证回执为准，不因页面显示完成就推定生产数据已恢复。未经记录的完整类型检查、真实外部依赖或全部业务流程不标为已通过。

## 回退

使用此前同一分支 Commit 重建静态资源，并恢复匹配的路由备份。不能将前端回退当作后端数据或 AgentTeams 任务状态回退；本次 Git 提交未改写历史。
