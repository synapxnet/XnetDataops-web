## GOAI finals release · v1.3.0

**[Release and source downloads](https://github.com/synapxnet/XnetDataops-web/releases/tag/v1.3.0) · [GOAI branch](https://github.com/synapxnet/XnetDataops-web/tree/GOAI-Competition) · [Matching backend](https://github.com/synapxnet/XnetDataops/releases/tag/v1.3.0) · [OpenXnet installer](https://github.com/synapxnet/OpenXnet/releases/tag/v1.3.0)**

This default `display` branch retains historical showcase code. The GOAI release badge links to the separate finals release; it does not claim that this branch or deployed services were upgraded. Download the pinned version from the release page.

Version 1.3.0 adds the governance workbench, lineage and quality evidence, DAG validation, resident Agent chat/tasks/configuration, and consistent login/theme controls. Its production build and 47 targeted tests passed; full type checking and every online page were not accepted as complete.

See the pinned [source delivery guide](https://github.com/synapxnet/XnetDataops-web/blob/d5c66e45f76732badfe3dd1c1c5ebb12b6be844d/docs/GOAI-V1.3.0-SOURCE-DELIVERY.md) for build instructions, dependencies and verification limits. This documentation update does not move the release tag or redeploy services.

---

<div align="center">

[简体中文](./README.md) | **English** | [日本語](./README.ja-JP.md)

# XnetDataops Web

**Web console for data engineering, governance, services, and audit**

[![GOAI release](https://img.shields.io/badge/GOAI%20release-1.3.0-1677ff.svg)](https://github.com/synapxnet/XnetDataops-web/releases/tag/v1.3.0) [![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/license-MIT-2ea44f.svg)](./LICENSE)

[Live Demo](https://www.xnetdataops.synapxnet.cn) · [Backend: XnetDataops](https://github.com/synapxnet/XnetDataops) · [OpenXnet](https://openxnet.synapxnet.com) · [License](./LICENSE)

</div>

> The images below are historical showcase screenshots, not the current v1.3.0 UI or acceptance evidence.

![XnetDataops overview](./docs/images/xnetdataops-overview.png)

## Product Tour (historical screenshots)

| Demo login | Data source configuration |
| --- | --- |
| ![Demo login](./docs/images/xnetdataops-login.png) | ![Data sources](./docs/images/xnetdataops-datasource.png) |
| Data integration | SQL workbench |
| ![Integration](./docs/images/xnetdataops-integration.png) | ![SQL workbench](./docs/images/xnetdataops-workbench.png) |
| Workflow scheduling | Data quality |
| ![Workflows](./docs/images/xnetdataops-workflows.png) | ![Quality](./docs/images/xnetdataops-quality.png) |
| Data lineage | Data APIs |
| ![Lineage](./docs/images/xnetdataops-lineage.png) | ![APIs](./docs/images/xnetdataops-api.png) |
| Masking | Observability |
| ![Masking](./docs/images/xnetdataops-masking.png) | ![Observability](./docs/images/xnetdataops-observability.png) |
| Audit | About |
| ![Audit](./docs/images/xnetdataops-audit.png) | ![About](./docs/images/xnetdataops-about.png) |

## Overview

XnetDataops Web is the open-source DataOps console maintained by the **SynapXnet team**. It provides a consistent workspace for source onboarding, integration, SQL development, scheduling, quality, governance, assets, APIs, masking, observability, and audit.

Together with the [XnetDataops backend](https://github.com/synapxnet/XnetDataops), it forms an enterprise-grade, multi-tenant, frontend/backend-separated system. The frontend uses Vue 3, TypeScript, Vite, Ant Design Vue, and the [Vue Vben Admin framework](https://github.com/vbenjs/vue-vben-admin).

## Highlights

- Enterprise multi-tenancy with role and data boundaries.
- Twelve business domains covering the complete DataOps lifecycle.
- Independent delivery and modular routes for enterprise integration.
- Dense operational views for repeatable engineering workflows.
- Continuous updates from the SynapXnet team.

## Modules

| Module | Capability |
| --- | --- |
| DSM | Data source connections and status |
| DIM | Full/incremental synchronization and logs |
| DDV | SQL workbench, scripts, and history |
| TSK | DAG workflows and task instances |
| DQM | Quality rules, reports, and alerts |
| DGV | Catalog, columns, lineage, and tags |
| DAS | Data assets, classification, and statistics |
| DAP | API configuration, keys, and call logs |
| DMS | Masking rules, policies, and execution logs |
| DOB | Data monitoring, events, and SLA |
| DAU | Audit, data changes, and compliance |
| USR | Users, roles, and access control |

## Development

```bash
corepack enable
pnpm install
pnpm dev:antd
pnpm build:antd
```

Use Node.js 20+ and pnpm 9.15.7. Never commit production credentials or access tokens.

## Demo

- URL: <https://www.xnetdataops.synapxnet.cn>
- Phone: `12345678900`
- Verification code: `000000`

The fixed code is only for the public showcase. Production must use secure authentication.

## License and Upstream

Released under the [MIT License](./LICENSE). The frontend uses [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin); its upstream MIT copyright and license notices are retained.

XnetDataops is part of [OpenXnet](https://openxnet.synapxnet.com). Copyright © 2026 SynapXnet.
