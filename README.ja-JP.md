<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0
Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
-->
# XnetDataOps Web

[简体中文](README.zh-CN.md) · [English](README.en-US.md) · 日本語

Vue 3、TypeScript、Vite、Ant Design Vue、Vue Vben Admin を使用した、XnetDataOps の企業向けデータガバナンスコンソールです。

## ワークスペース

データ接続、開発、DAG スケジュール、品質、リネージ、資産、マスキング、可観測性、監査を一つの画面体系で提供します。常駐 Agent の会話、タスク、モデル設定、ナレッジ、Skill 管理、横断復旧の証拠表示、テーマとカスタムスキンも通常の製品機能として利用できます。

## ビルド

Node.js 20.10 以降と pnpm 9.15.7 を使用します。

```bash
pnpm install --frozen-lockfile
pnpm build:antd
```

出力先は `apps/web-antd/dist` です。ローカル開発は `pnpm dev:antd` で開始します。`apps/web-antd/vite.config.mts` のバックエンドプロキシは `XNET_DATAOPS_<MODULE>_URL` で設定します。`main` ブランチのワークフローは Web をビルド・テストして成果物を保存するもので、サーバーにはデプロイしません。

## 環境の接続

[バックエンド](https://github.com/synapxnet/XnetDataops) が業務・認証 API を提供します。本番では `.env.production` の同一オリジン経路を、ゲートウェイで自社バックエンドに接続します。

- 企業の電話番号とワンタイム SMS コードでログインします。既定のアカウントや固定コードはありません。SMS 配信はバックエンドで設定します。
- ログイン画面のプラットフォームリンクは `VITE_XNET_AIOPS_URL`、`VITE_XNET_DATAOPS_URL`、`VITE_XNET_MLOPS_URL` で設定します。空欄のリンクは非表示です。
- 常駐 Agent API は `/api/resident/v1/` です。現在のユーザーと組織の範囲を適用し、モデルプロバイダーの秘密鍵はサーバーで管理します。
- ガバナンスと復旧画面は認可された証拠を取得します。データなし、未設定、取得失敗を区別し、本番と合成証拠の出所も維持します。

開発の主ブランチは `main` です。[移行メモ](docs/MAINLINE-TRANSITION-20261023.md) に機能と検証範囲を記載しています。過去のリリースは Git 履歴とタグから参照できます。

## ライセンス

[LICENSE](LICENSE) と各コンポーネントの表記に従ってください。Vue Vben Admin の著作権とライセンスを保持してください。
