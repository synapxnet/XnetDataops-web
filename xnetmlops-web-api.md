# XnetMLops Web API 路径配置说明

## 概述

本文档说明前端 API 请求路径的配置规则，避免路径配置错误导致 404 问题。

## 架构说明

```
前端请求 → Vite 代理 → 后端服务
```

## 请求客户端配置

前端使用多个请求客户端，每个客户端有不同的 baseURL：

| 客户端 | baseURL | 目标服务 |
|--------|---------|----------|
| `smpRequestClient` | `/smp` | SMP 服务 (8185) |
| `dppRequestClient` | `/dpp` | DPP 服务 (8182) |
| `mtpRequestClient` | `/mtp` | MTP 服务 (8183) |
| `mepRequestClient` | `/mep` | MEP 服务 (8184) |
| `xaaRequestClient` | `/xaa` | XAA 服务 (8085) |

配置文件：`apps/web-antd/src/api/request.ts`

## Vite 代理配置

配置文件：`apps/web-antd/vite.config.mts`

### SMP 服务代理规则

SMP 服务有两种 API 路径格式：

#### 1. 标准格式（推荐）

后端路径：`/api/xxx`（如 `/api/hadoop`, `/api/jenkins-masters`）

```typescript
// 前端 API 写法
smpRequestClient.get('/hadoop/versions')

// 实际请求路径
// /smp/hadoop/versions

// 代理转换
// /smp/hadoop/versions → /hadoop/versions → http://192.168.1.156:8185/api/hadoop/versions
```

#### 2. 带 /smp 前缀格式

后端路径：`/api/smp/xxx`（如 `/api/smp/workstations`）

```typescript
// 前端 API 写法
smpRequestClient.get('/smp/workstations')

// 实际请求路径
// /smp/smp/workstations

// 代理转换
// /smp/smp/workstations → /api/smp/workstations → http://192.168.1.156:8185/api/smp/workstations
```

### 代理规则优先级

Vite 代理按照定义顺序匹配，更具体的路径应放在前面：

```typescript
proxy: {
  // 1. 先匹配 /smp/smp（更具体）
  '/smp/smp': {
    rewrite: (path) => path.replace(/^\/smp\/smp/, '/api/smp'),
    target: 'http://192.168.1.156:8185',
  },
  // 2. 再匹配 /smp（通用）
  '/smp': {
    rewrite: (path) => path.replace(/^\/smp/, ''),
    target: 'http://192.168.1.156:8185/api',
  },
}
```

## API 路径对照表

### SMP 服务

| 模块 | 前端 API 路径 | 后端 Controller 路径 | 说明 |
|------|--------------|---------------------|------|
| Hadoop | `/hadoop/xxx` | `/api/hadoop` | 标准格式 |
| Jenkins Master | `/smp/jenkins-masters/xxx` | `/api/smp/jenkins-masters` | 带前缀格式 |
| Jenkins Node | `/smp/jenkins-nodes/xxx` | `/api/smp/jenkins-nodes` | 带前缀格式 |
| Jenkins Versions | `/smp/jenkins-versions/xxx` | `/api/smp/jenkins-versions` | 带前缀格式 |
| Workstation | `/smp/workstations/xxx` | `/api/smp/workstations` | 带前缀格式 |
| Datasource | `/smp/datasource/xxx` | `/api/smp/datasource` | 带前缀格式 |
| Algorithm | `/smp/algorithms/xxx` | `/api/smp/algorithms` | 带前缀格式 |
| Feature Operator | `/smp/feature-operators/xxx` | `/api/smp/feature-operators` | 带前缀格式 |
| Bucket | `/smp/bucket/xxx` | `/api/smp/bucket` | 带前缀格式 |
| Harbor | `/smp/harbor/xxx` | `/api/smp/harbor` | 带前缀格式 |
| Dockerfile | `/smp/dockerfile/xxx` | `/api/smp/dockerfile` | 带前缀格式 |
| Dept Tree | `/smp/dept-tree-data` | `/api/smp/dept-tree-data` | 带前缀格式 |

## 新增 API 注意事项

### 1. 确定后端路径格式

- 如果后端 Controller 使用 `@RequestMapping("/api/xxx")`，前端 API 路径写 `/xxx`
- 如果后端 Controller 使用 `@RequestMapping("/api/smp/xxx")`，前端 API 路径写 `/smp/xxx`

### 2. 示例

**标准格式（后端 `/api/hadoop`）**：

```typescript
// 后端
@RequestMapping("/api/hadoop")
public class HadoopController { ... }

// 前端
smpRequestClient.get('/hadoop/versions')
```

**带前缀格式（后端 `/api/smp/workstations`）**：

```typescript
// 后端
@RequestMapping("/api/smp/workstations")
public class WorkstationController { ... }

// 前端
smpRequestClient.get('/smp/workstations')
smpRequestClient.get('/smp/workstations/online')
smpRequestClient.get(`/smp/workstations/${id}/credentials`)
```

## 常见错误排查

### 404 Not Found

1. **检查请求路径**：浏览器开发者工具查看实际请求 URL
2. **检查代理配置**：确认 `vite.config.mts` 中的代理规则
3. **检查后端路径**：确认 Controller 的 `@RequestMapping` 注解

### 路径重复（如 `/smp/smp/smp/...`）

- 检查前端 API 路径是否多写了前缀
- 确认 baseURL 和 API 路径的组合是否正确

## 更新日志

- 2026-02-10: 添加 `/smp/smp` 代理规则，支持 workstation 等模块的 `/api/smp/xxx` 路径格式
