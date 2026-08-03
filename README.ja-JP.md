<div align="center">

[简体中文](./README.md) | [English](./README.en-US.md) | **日本語**

# XnetDataops Web

**データエンジニアリング、ガバナンス、サービス、監査の Web コンソール**

[![Version](https://img.shields.io/badge/version-1.0.0-1677ff.svg)](https://www.xnetdataops.synapxnet.cn) [![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/) [![License](https://img.shields.io/badge/license-MIT-2ea44f.svg)](./LICENSE)

[オンラインデモ](https://www.xnetdataops.synapxnet.cn) · [バックエンド: XnetDataops](https://github.com/synapxnet/XnetDataops) · [OpenXnet](https://openxnet.synapxnet.com) · [ライセンス](./LICENSE)

</div>

![XnetDataops 概要](./docs/images/xnetdataops-overview.png)

## 画面プレビュー

| デモログイン | データソース設定 |
| --- | --- |
| ![デモログイン](./docs/images/xnetdataops-login.png) | ![データソース](./docs/images/xnetdataops-datasource.png) |
| データ統合 | SQL ワークベンチ |
| ![データ統合](./docs/images/xnetdataops-integration.png) | ![SQL ワークベンチ](./docs/images/xnetdataops-workbench.png) |
| ワークフロー | データ品質 |
| ![ワークフロー](./docs/images/xnetdataops-workflows.png) | ![データ品質](./docs/images/xnetdataops-quality.png) |
| データリネージ | データ API |
| ![リネージ](./docs/images/xnetdataops-lineage.png) | ![データ API](./docs/images/xnetdataops-api.png) |
| マスキング | 可観測性 |
| ![マスキング](./docs/images/xnetdataops-masking.png) | ![可観測性](./docs/images/xnetdataops-observability.png) |
| 監査 | プロジェクト情報 |
| ![監査](./docs/images/xnetdataops-audit.png) | ![プロジェクト情報](./docs/images/xnetdataops-about.png) |

## 概要

XnetDataops Web は **SynapXnet チーム**が公開する DataOps コンソールです。データソース、統合、SQL 開発、スケジューリング、品質、ガバナンス、資産、API、マスキング、可観測性、監査を一つの画面で提供します。

[XnetDataops バックエンド](https://github.com/synapxnet/XnetDataops) と組み合わせることで、企業向けマルチテナント、フロントエンド・バックエンド分離システムを構成します。Vue 3、TypeScript、Vite、Ant Design Vue、および [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) を採用しています。

## GOAI Competition 1.0.0

`GOAI-Competition` ブランチは `/agent/incidents/:incidentId/data-evidence` を追加し、品質、Schema、リネージュ、ワークフロー証拠をまとめて表示します。欠損、部分失敗、ログ参照不可を明示し、フロントエンド定数から 120/128 次元の結論を作りません。

[ルート引数、連携、検証結果](./docs/goai-handoff/HANDOFF-GOAI-COMPETITION-1.0.0.md) · [XnetDataops バックエンド](https://github.com/synapxnet/XnetDataops/tree/GOAI-Competition)

## 特長

- ロールとデータ境界を備えた企業向けマルチテナント。
- DataOps ライフサイクル全体をカバーする 12 の業務領域。
- 独立配備とモジュール化ルートによる柔軟な企業統合。
- 反復作業に適した高密度な運用画面。
- SynapXnet チームによる継続的な更新。

## モジュール

| モジュール | 主な機能 |
| --- | --- |
| DSM | データソース接続と状態 |
| DIM | 全量・増分同期とログ |
| DDV | SQL、スクリプト、履歴 |
| TSK | DAG ワークフローとタスク |
| DQM | 品質ルール、レポート、アラート |
| DGV | カタログ、カラム、リネージ、タグ |
| DAS | データ資産、分類、統計 |
| DAP | API、キー、呼出ログ |
| DMS | マスキングルール、ポリシー、実行履歴 |
| DOB | データ監視、イベント、SLA |
| DAU | 監査、データ変更、コンプライアンス |
| USR | ユーザー、ロール、アクセス制御 |

## 開発

```bash
corepack enable
pnpm install
pnpm dev:antd
pnpm build:antd
```

Node.js 20+ と pnpm 9.15.7 を使用してください。本番の認証情報やトークンをコミットしないでください。

## デモ

- URL: <https://www.xnetdataops.synapxnet.cn>
- 電話番号: `12345678900`
- 確認コード: `000000`

固定確認コードは公開デモ専用です。本番環境では安全な認証方式を使用してください。

## ライセンスと上流プロジェクト

[MIT License](./LICENSE) の下で公開されています。フロントエンドは [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) を採用し、上流プロジェクトの MIT 著作権・ライセンス表示を保持しています。

XnetDataops は [OpenXnet](https://openxnet.synapxnet.com) の一部です。Copyright © 2026 SynapXnet.
