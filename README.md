<div align="center">

# XnetDataops Web

**XnetDataops 数据工程与治理平台的 Web 控制台**

[![Version](https://img.shields.io/badge/version-1.0.0-1677ff.svg)](https://www.xnetdataops.synapxnet.cn)
[![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-2ea44f.svg)](./LICENSE)

[在线体验](https://www.xnetdataops.synapxnet.cn) · [OpenXnet 开源社区](https://openxnet.synapxnet.com) · [查看许可](./LICENSE)

</div>

![XnetDataops 平台概览](./docs/images/xnetdataops-overview.png)

## 项目简介

XnetDataops Web 是由 **SynapXnet 团队**开源的数据工程控制台，为数据接入、开发、调度、治理、服务化与审计提供一致的操作体验。首页以关键指标和管道健康度展示平台状态，侧边导航覆盖完整的数据生命周期。

项目基于 Vue 3、TypeScript、Vite、Ant Design Vue 与 Vben Admin，使用模块化路由组织十二个业务域，便于团队按业务职责并行开发和扩展。

## 功能模块

| 模块 | 主要功能 |
| --- | --- |
| DSM 数据源管理 | 数据源连接、新增配置、连通性检查与生命周期维护 |
| DIM 数据集成 | 同步任务、字段映射、执行控制与同步日志 |
| DDV 数据开发 | SQL 工作台、脚本管理、保存查询与查询历史 |
| TSK 任务调度 | DAG 工作流设计、节点依赖、任务实例与运行状态 |
| DQM 数据质量 | 质量规则、检测报告、质量告警与通过率跟踪 |
| DGV 数据治理 | 元数据目录、数据血缘、字段信息与标签体系 |
| DAS 数据资产 | 资产目录、分类分级、检索与资产统计 |
| DAP 数据 API | API 配置、密钥管理、调用日志与服务监控 |
| DMS 数据脱敏 | 脱敏规则、策略组合和任务执行记录 |
| DOB 数据可观测 | 数据监控、事件中心、SLA 与管道健康度 |
| DAU 数据审计 | 操作记录、数据变更追踪与合规报告 |
| USR 系统管理 | 用户、角色、权限与登录认证 |

## 前端架构

```mermaid
flowchart LR
    Browser["浏览器"] --> Router["Vue Router"]
    Router --> Modules["DataOps 业务模块"]
    Modules --> Store["Pinia 状态管理"]
    Modules --> API["统一 API Client"]
    API --> Services["十二个 DataOps 微服务"]
    UI["Ant Design Vue / Vben"] --> Modules
```

## 技术栈

- Vue 3 + TypeScript
- Vite + Turbo
- Ant Design Vue + Vben Admin
- Pinia + Vue Router
- pnpm 9.15.7

## 快速开始

### 环境要求

- Node.js 20+
- pnpm 9.15.7

### 本地开发

```bash
corepack enable
pnpm install
pnpm dev:antd
```

### 生产构建

```bash
pnpm build:antd
```

部署前请根据目标环境检查 `apps/web-antd` 下的环境变量和 API 地址配置。不要将真实密钥、生产令牌或服务器凭据提交到仓库。

## 在线体验

- 访问地址：<https://www.xnetdataops.synapxnet.cn>
- 演示手机号：`12345678900`
- 演示验证码：`000000`

固定验证码仅用于公开演示。生产部署应接入安全的身份认证与验证码服务。

## SynapXnet 开源生态

本项目属于 SynapXnet 开源项目矩阵。访问 [OpenXnet](https://openxnet.synapxnet.com) 获取更多团队项目与社区信息。

## 参与贡献

欢迎提交 Issue 与 Pull Request。新增业务页面时请遵循现有路由、权限、状态管理和请求层约定，并同步维护必要的类型定义。

## 开源许可

本项目基于 [MIT License](./LICENSE) 开源。前端基础工程沿用 Vben 的 MIT 授权，相关版权声明已保留在许可文件中。
