<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
DataOps 版本、接入与复现说明 / DataOps version, access and reproduction guide.
Author: maoyo | Department: 研发部 | Date: 2026-09-18 | Version: 1.3.0
Maintainer: maoyo
-->

# XnetDataOps Web

[![GOAI release](https://img.shields.io/badge/GOAI%20release-1.3.0-1677ff.svg)](https://github.com/synapxnet/XnetDataops-web/releases/tag/v1.3.0)

[简体中文](README.md) · [English](README.en-US.md) · [日本語](README.ja-JP.md)

データガバナンス、DAG 編集、証拠表示、常駐 Agent 操作の Web コンソールです。

**[v1.3.0 固定ソース](https://github.com/synapxnet/XnetDataops-web/tree/v1.3.0) · [リリースとダウンロード](https://github.com/synapxnet/XnetDataops-web/releases/tag/v1.3.0) · [対応バックエンド](https://github.com/synapxnet/XnetDataops/tree/v1.3.0) · [OpenXnet インストーラー](https://github.com/synapxnet/OpenXnet/releases/tag/v1.3.0)**

既定の `display` は過去の展示コードを保持します。GOAI release バッジは別の決勝リリースを示します。再現には以下の固定タグを取得してください。README の変更でタグ、ソース ZIP、稼働中サービスは更新されません。

## 現在のデモとログイン

- Staging: [https://goai.xnetdataops.synapxnet.online/](https://goai.xnetdataops.synapxnet.online/)、[ログイン画面](https://goai.xnetdataops.synapxnet.online/#/auth/login)。
- 公開デモ電話番号：**`17870171303`**。6 桁のデモ確認コード：**`000000`**。許可されたデモ環境専用であり、パスワードログインではありません。
- 2026-09-18 にログインと読み取りのみの身份・常駐状態確認が成功しました。ユーザーは `goai_operator`、ロールは `DEVELOPER`、常駐プラットフォームは `dataops`、Agent は `1.3.0 / ONLINE`、モデル・ツールは設定済みです。業務変更や完全なクロスプラットフォーム実行は検証していません。

[現在の認証実装](https://github.com/synapxnet/XnetDataops/blob/v1.3.0/dataops-usr-service/src/main/java/com/synapxnet/dataopsusrservice/service/impl/AuthServiceImpl.java)は事前登録のデモ身份のみを受け付けます。コード送信 API はデモ印を返し、**実際の SMS は送信しません**。上記コードを直接使用してください。自己登録と QR ログインは未接続です。実運用にはデモ認証を置き換え、自社ユーザーと組織権限を設定する必要があります。

このコードは DataOps の Web ログイン専用です。**AgentTeams アクセスコードや Live 実行許可とは異なります**。それらは OpenXnet のワークスペースごとに別途設定します。モデル API キーや内部資格情報は掲載しません。

## API と常駐 Agent

| 用途 | ブラウザーの同一オリジンパス | 範囲 |
|---|---|---|
| 認証・身份 | `/api`（`/api/login`、`/api/user/info`） | ゲートウェイで USR `/api/usr` に転送。ブラウザーで `/usr` を重複追加しません |
| 業務サービス | `/dsm`、`/dim`、`/ddv`、`/tsk`、`/dqm`、`/dgv`、`/das`、`/dap`、`/dms`、`/dob`、`/dau` | 組織・チーム・リソース権限が必要 |
| ガバナンス | `/dgv/governance/workbench` | 現在は独立した読み取り専用ルート |
| 常駐 Agent | `/api/resident/v1/`、状態は `/api/resident/v1/status` | プラットフォーム認証とサーバー側権限判定 |

実行時設定 `VITE_GLOB_API_URL=/api` を確認済みです。未認証の常駐状態、組織ツリー、ガバナンス読み取りは拒否されます。`/api/user/info` は HTTP 200 内に業務エラーを返す場合があるため、HTTP だけでなく `code` も確認してください。

[共通常駐サービス](https://github.com/synapxnet/OpenXnet/tree/v1.3.0/services/platform-resident-agent)は Java 業務プロセスや AgentTeams とは独立しています。プラットフォーム内チャット、許可ツール、タスク表示を提供します。現在の移譲状態は `handoffAvailable=false / PENDING_INTEGRATION` であり、常駐 Agent からの自動クロスプラットフォーム移譲は未接続です。クロスプラットフォームデモは既存の OpenXnet/AgentTeams 接続を使用します。内部 `/health` は確認した公開ゲートウェイで独立公開されていないため、認証済みの状態 API を利用します。

## 能力と検証範囲

ガバナンス画面、リネージ・品質証拠、DAG 検証、常駐チャット・タスク・設定、統一ログイン・テーマ・スキン入出力を含みます。内部依存と Vite 本番ビルド、および対象テスト 47/47 件が成功しました。全型検査と全オンライン業務の検証は完了扱いではなく、Browserslist と大きな chunk の警告が残ります。

詳細は [固定版納品ガイド](https://github.com/synapxnet/XnetDataops-web/blob/v1.3.0/docs/GOAI-V1.3.0-SOURCE-DELIVERY.md) を参照してください。ソース公開、README 更新、今回の読み取り検証は、稼働中の全コンポーネントが同じコミットであることの証明ではありません。

## 固定版ビルド

```bash
git clone --branch v1.3.0 --single-branch https://github.com/synapxnet/XnetDataops-web.git
cd XnetDataops-web
corepack enable
corepack prepare pnpm@9.15.7 --activate
pnpm install --frozen-lockfile
pnpm build:antd
```

**Node.js 20.10+、pnpm 9.15.7** が必要です。Vue 3、TypeScript、Vite/Turbo、Ant Design Vue、Pinia、Vue Router、Vben Admin を使用します。成果物は `apps/web-antd/dist` です。内部ワークスペースの stub と依存の準備が必要であり、インストールスクリプトを無効化した場合は納品ガイドに従ってください。

`pnpm dev:antd` の前に `apps/web-antd/vite.config.mts` を確認してください。固定タグには過去のプライベートネットワーク宛先と未完成の常駐プロキシが残っています。自分の許可されたバックエンドと常駐パスを設定し、開発先を公開デモ URL と混同しないでください。

本番では `apps/web-antd/.env.production` の同一オリジン接頭辞を使用し、上流はゲートウェイで管理します。ブラウザーにモデルキーを置かないでください。旧 `deploy/` には他プラットフォーム共通例があり、検証済みの一括導入ではありません。ガバナンスの精密な読み取り専用ルートと組織認証を維持してください。

## 過去の画像

以下は以前の展示版です。現在の v1.3.0 UI や今回の検証証拠ではありません。

![過去の DataOps 概要](docs/images/xnetdataops-overview.png)

## ライセンスと貢献

[LICENSE](LICENSE) と各コンポーネントの宣言を参照してください。フロントエンドは [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) に基づき、上流の著作権とライセンスを保持します。Issues/PR には版、再現手順、秘匿化した証拠を添え、実資格情報は含めないでください。
