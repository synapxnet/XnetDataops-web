<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0
Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
-->
# XnetDataOps Web

[简体中文](README.zh-CN.md) · English · [日本語](README.ja-JP.md)

The enterprise data governance console for XnetDataOps, built with Vue 3, TypeScript, Vite, Ant Design Vue and Vue Vben Admin.

## Workspaces

Data ingestion, development, DAG scheduling, quality, lineage, assets, masking, observability and audit share one console. Resident Agent conversations, tasks, model configuration, knowledge and Skill management, cross-domain recovery evidence, themes and custom skins are retained as normal product capabilities.

## Build

Use Node.js 20.10 or later and pnpm 9.15.7.

```bash
pnpm install --frozen-lockfile
pnpm build:antd
```

The output is `apps/web-antd/dist`. Run `pnpm dev:antd` for local development. Configure backend proxies in `apps/web-antd/vite.config.mts` through the `XNET_DATAOPS_<MODULE>_URL` variables. The `main` branch workflow builds, tests and uploads a web artifact; it does not deploy to servers.

## Connect your deployment

The [backend](https://github.com/synapxnet/XnetDataops) supplies business and authentication APIs. Production uses the same-origin paths in `.env.production`, connected to your backend through a gateway.

- Login uses an enterprise phone number and a one-time SMS code. Accounts are not prefilled and there is no fixed verification code. SMS delivery is configured on the backend.
- Configure `VITE_XNET_AIOPS_URL`, `VITE_XNET_DATAOPS_URL` and `VITE_XNET_MLOPS_URL` for platform links on the login page; empty settings hide the links.
- The resident Agent API is `/api/resident/v1/`, scoped to the current identity and organization. Provider keys stay on the server.
- Governance and recovery workspaces read authorized evidence. Empty data, missing configuration and request failures have separate states. Production and synthetic evidence remain distinguishable.

The active development branch is `main`. [Transition notes](docs/MAINLINE-TRANSITION-20261023.md) describe retained capabilities and verification scope. Historical releases remain available through Git history and tags.

## License

See [LICENSE](LICENSE) and individual component notices. Preserve the upstream Vue Vben Admin copyright and license.
