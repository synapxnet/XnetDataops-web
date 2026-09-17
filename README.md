<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
DataOps 版本、接入与复现说明 / DataOps version, access and reproduction guide.
Author: maoyo | Department: 研发部 | Date: 2026-09-18 | Version: 1.3.0
Maintainer: maoyo
-->

# XnetDataOps Web

[![GOAI release](https://img.shields.io/badge/GOAI%20release-1.3.0-1677ff.svg)](https://github.com/synapxnet/XnetDataops-web/releases/tag/v1.3.0)

数据工程与治理平台的 Web 控制台，提供治理工作台、DAG 编辑、证据浏览和驻场 Agent 交互。

**[v1.3.0 固定源码](https://github.com/synapxnet/XnetDataops-web/tree/v1.3.0) · [发布页](https://github.com/synapxnet/XnetDataops-web/releases/tag/v1.3.0) · [源码 ZIP](https://github.com/synapxnet/XnetDataops-web/releases/download/v1.3.0/XnetDataops-web-v1.3.0-source.zip) · [配套后端 v1.3.0](https://github.com/synapxnet/XnetDataops/tree/v1.3.0) · [OpenXnet 安装包](https://github.com/synapxnet/OpenXnet/releases/tag/v1.3.0)**

复现统一使用 `v1.3.0` 标签或本页对应的源码 ZIP；当前版本说明随源码提供。本次发布文档整理不会重新部署线上服务。

## 当前演示入口与登录

| 项目 | 已核验入口或说明 |
|---|---|
| DataOps Staging | [https://goai.xnetdataops.synapxnet.online/](https://goai.xnetdataops.synapxnet.online/) |
| 登录页 | [手机号验证码登录](https://goai.xnetdataops.synapxnet.online/#/auth/login) |
| 公开演示手机号 | `17870171303` |
| 六位演示验证码 | `000000`，仅用于已授权演示环境 |
| 登录方式 | 手机号 + 演示验证码，不是账号密码登录 |
| 当前演示身份 | `goai_operator`，角色 `DEVELOPER`；页面和工具权限仍由服务端决定 |

2026-09-18 已实际完成上述演示登录、身份读取和驻场状态读取：返回平台 `dataops`、Agent 版本 `1.3.0`、`ONLINE`，模型及工具配置已就绪。只执行登录和只读检查，没有运行数据变更、训练或跨平台执行。公开演示环境可能维护，网页可达不等于每条业务链可执行。

[当前认证实现](https://github.com/synapxnet/XnetDataops/blob/v1.3.0/dataops-usr-service/src/main/java/com/synapxnet/dataopsusrservice/service/impl/AuthServiceImpl.java)仅接受预置演示身份；发送验证码入口返回演示标记，**没有接入真实短信投递**。因此请直接使用上述演示验证码，不要把界面“验证码已发送”当作真实短信到达证明。账号开通由管理员处理；扫码登录尚未接入。正式部署需更换演示认证并配置自己的用户、组织与权限，不应直接公开演示认证服务。

此验证码只用于 DataOps 网页登录，**不是 AgentTeams 演示访问码，也不是 Live 执行授权**。后两项按 OpenXnet 工作空间另行配置；模型 API Key、服务端委托凭据不会在 README 提供。

## API 与驻场 Agent

| 用途 | 浏览器同源路径 | 边界 |
|---|---|---|
| 用户认证与身份 | `/api`，如 `/api/login`、`/api/user/info` | 网关转发到 USR 的 `/api/usr`，不要在浏览器再重复拼接 `/usr` |
| 原生业务 | `/dsm`、`/dim`、`/ddv`、`/tsk`、`/dqm`、`/dgv`、`/das`、`/dap`、`/dms`、`/dob`、`/dau` | 按组织、团队和资源范围授权 |
| 治理工作台 | `/dgv/governance/workbench` | 当前线上是独立只读路由，不能据此推断拥有治理写权限 |
| 驻场服务 | `/api/resident/v1/`，状态为 `/api/resident/v1/status` | 需要平台登录；服务端判断配置和工具权限 |

线上运行配置已核验 `VITE_GLOB_API_URL=/api`。未登录读取驻场状态、组织树和治理工作台均被拒绝；`/api/user/info` 的未认证响应可能是 HTTP 200 包裹业务错误，必须同时检查业务 `code`，不能只看 HTTP 200 就判定健康。

驻场 Agent 使用[共享独立服务](https://github.com/synapxnet/OpenXnet/tree/v1.3.0/services/platform-resident-agent)，不等同于 Java 业务进程，也不等同于 AgentTeams 团队。它能够在平台内聊天、读取已授权工具和展示任务；本次状态回包的自动跨域移交仍为 `handoffAvailable=false / PENDING_INTEGRATION`，不能宣称点击移交已接通真实跨域编排。跨平台演示由 OpenXnet/AgentTeams 的既有接入链组织。服务内部 `/health` 没有在已核验公网网关中单独开放，公网应使用需登录的状态接口。

## v1.3.0 能力与验证范围

- 治理工作台、数据血缘和质量证据、DAG 编辑校验，以及驻场 Agent 聊天、任务与模型配置入口。
- 统一品牌登录、深浅主题和皮肤导入导出，保留各业务模块入口与请求失败状态。
- 前端内部依赖与 Vite 生产构建通过，七组定向测试 **47/47 通过**。全量类型检查和所有页面线上业务验收未列为通过；构建仍有 Browserslist 数据陈旧及大分块提示。

完整来源、测试和限制见 [v1.3.0 源码交付说明](https://github.com/synapxnet/XnetDataops-web/blob/v1.3.0/docs/GOAI-V1.3.0-SOURCE-DELIVERY.md)。源码发布、README 更新和本次只读接入核验都不意味着线上所有组件已重新部署到同一个源码提交。 构建与测试对应[程序验证基线 d5c66e45](https://github.com/synapxnet/XnetDataops-web/commit/d5c66e45f76732badfe3dd1c1c5ebb12b6be844d)；之后的发布对齐只更新 README，程序文件与该基线一致。

## 固定版本构建

```bash
git clone --branch v1.3.0 --single-branch https://github.com/synapxnet/XnetDataops-web.git
cd XnetDataops-web
```

要求 **Node.js 20.10+、pnpm 9.15.7**，以 [package.json](https://github.com/synapxnet/XnetDataops-web/blob/v1.3.0/package.json) 与锁文件为准。技术栈为 Vue 3、TypeScript、Vite/Turbo、Ant Design Vue、Pinia、Vue Router，基于 Vue Vben Admin。

```bash
corepack enable
corepack prepare pnpm@9.15.7 --activate
pnpm install --frozen-lockfile
pnpm build:antd
```

正式静态资源来自 `apps/web-antd/dist`。内部工作区需要先生成 stub/构建依赖，不能从空依赖目录直接运行 Vite。禁用安装生命周期脚本时，按交付说明显式完成内部包准备；本次已验证构建路径在该说明中列明。

本地开发使用 `pnpm dev:antd`，但启动前必须检查 [开发代理配置](https://github.com/synapxnet/XnetDataops-web/blob/v1.3.0/apps/web-antd/vite.config.mts)：固定标签保留历史局域网目标，没有配置可直接复用的公网代理，也没有完整驻场代理。将其改为自己授权的后端，补齐驻场前缀；不要把开发代理地址当作演示网站地址。

生产环境沿用 [.env.production](https://github.com/synapxnet/XnetDataops-web/blob/v1.3.0/apps/web-antd/.env.production) 的同源前缀，由网关配置上游。模型密钥不能写入浏览器环境变量。仓库旧 `deploy/` 中仍含跨平台通用示例，不能作为当前 DataOps 的一键部署脚本；还须保留治理工作台的精确只读路由和组织鉴权。

## 历史截图

以下是历史展示版图片，仅供理解模块布局，不是 v1.3.0 当前 UI 或本次验收证据。

![DataOps 历史展示概览](docs/images/xnetdataops-overview.png)

## 许可与贡献

以本仓库 [LICENSE](LICENSE) 及组件各自声明为准。前端基于 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin)，保留上游版权与许可。欢迎通过本仓库 Issues/PR 提交问题；请附版本、复现路径和脱敏证据，不附真实凭据。
