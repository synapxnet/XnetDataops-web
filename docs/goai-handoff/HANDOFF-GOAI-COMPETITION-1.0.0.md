# GOAI Competition 1.0.0 前端交接

- 仓库：`synapxnet/XnetDataops-web`
- 任务：`DATAOPS-FE-01`
- Worktree：`D:\synapxnet\.codex-build\goai-competition-1.0.0\XnetDataops-web`
- 分支：`GOAI-Competition`
- 基线提交：`11cd87e2a68bfd71633b7d7f1f02fef4f0f4c1a3`
- 结束提交：见 `GOAI-Competition` 分支候选 HEAD
- 产品/契约版本：`1.0.0`

## 页面与数据边界

深链：

```text
/agent/incidents/inc_model_contract_001/data-evidence?workspaceId=ws_goai_demo&traceId=trace_model_contract_001&reportUid=qr_risk_features_120&assetUid=asset_risk_features_prod&workflowInstanceUid=task_risk_features_latest
```

页面并行加载质量、Schema、血缘和工作流四类 `ToolResponse`。120 字段、128 维期望、Schema Hash、输出资产和日志摘要都来自后端证据；前端不维护维度结论常量。

文件所有权：

- `apps/web-antd/src/views/AGENT/`
- `apps/web-antd/src/router/routes/modules/AGENT.ts`
- `apps/web-antd/src/api/request.ts` 中的 Agent Service Client

## 配置与联调

Agent Client 分别指向 DQM、DGV 和 TSK Service。配置值由部署环境注入，仓库不保存 Token。后端比赛分支：[`synapxnet/XnetDataops`](https://github.com/synapxnet/XnetDataops/tree/GOAI-Competition)。

## 验证记录

```powershell
node node_modules\vue-tsc\bin\vue-tsc.js --noEmit --skipLibCheck -p <isolated-dataops-tsconfig>
```

结果：本次新增路由和 Vue 页面 0 类型错误；`pnpm build:antd` 生产构建通过，Turbo 11/11 任务成功并生成完整 Vite 产物。全仓 `pnpm -F @vben/web-antd run typecheck` 已执行，但仍被比赛改造前既有页面的类型问题阻塞；这些存量错误不来自 AGENT 页面，需作为仓库级技术债单独关闭。发布 CI 仍需复跑全仓 typecheck、单测、lint 和生产构建。

## 已知限制与回退

- 大血缘图、日志关闭、部分 503 和跨 Workspace 403 需在受控联调环境验证。
- 回退删除新增 AGENT 路由/页面与 Client，不影响现有 DataOps 页面。
- 任何新增展示字段应先更新公共 1.x 契约，不能在页面临时兼容自由字段。
