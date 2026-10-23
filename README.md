<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0
Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
-->
# XnetDataOps Web

简体中文 · [English](README.en-US.md) · [日本語](README.ja-JP.md)

XnetDataOps 企业数据治理控制台，基于 Vue 3、TypeScript、Vite、Ant Design Vue 与 Vue Vben Admin。

## 工作区

保留数据接入、开发、DAG 调度、数据质量、血缘、资产、脱敏、观测和审计页面，以及驻场 Agent 会话、任务、模型配置、知识与 Skill 能力工作台、跨域恢复证据、主题和皮肤功能。

## 构建

要求 Node.js 20.10+、pnpm 9.15.7。

```bash
pnpm install --frozen-lockfile
pnpm build:antd
```

输出目录为 `apps/web-antd/dist`。本地运行使用 `pnpm dev:antd`，代理由 `apps/web-antd/vite.config.mts` 中的 `XNET_DATAOPS_<MODULE>_URL` 配置。`main` 的 CI 执行构建与测试并保存前端产物，不执行服务器部署。

## 接入

[配套后端](https://github.com/synapxnet/XnetDataops) 提供业务和登录接口。生产环境沿用 `.env.production` 的同源路径，经网关连接自己的后端。

- 登录使用企业手机号与一次性短信验证码，不预填账号，不提供固定验证码；短信服务由后端配置。
- `VITE_XNET_AIOPS_URL`、`VITE_XNET_DATAOPS_URL`、`VITE_XNET_MLOPS_URL` 设置登录页的平台导航，空值隐藏对应链接。
- 驻场 Agent 接口为 `/api/resident/v1/`，使用当前登录身份和组织范围；模型密钥在服务端管理。
- 治理工作台和跨域恢复工作区读取真实授权数据，空结果、未配置与失败分别呈现。

[主线整理说明](docs/MAINLINE-TRANSITION-20261023.md) 记录功能保留与验证范围。当前开发主线为 `main`。历史发布保留在 Git 历史和版本标签。

## 许可

以 [LICENSE](LICENSE) 及组件声明为准；保留 Vue Vben Admin 上游版权和许可。
