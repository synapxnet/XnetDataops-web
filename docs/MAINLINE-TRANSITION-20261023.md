<!--
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential.
Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0 | Security Level: INTERNAL
Maintainer: maoyo | Email: synapxnet@gmail.com
-->
# DataOps 主线清理设计

## 范围

以已发布 backend 578265d / frontend d15a6ea 为基线，补齐 9 月 19 日已部署的驻场能力工作台。历史比赛版本、归档和线上数据库不在本轮改写范围。

## 保留能力

保留十二个业务服务、驻场 Agent 会话/知识/Skill、跨平台治理契约、审批校验、幂等、资源版本、审计、真实特征漂移执行桥接、独立证据工作区、数据血缘和 DAG 工作流，以及登录视觉、皮肤等改进。内部 Java package 和既有工具名保持兼容。

## 清理与接入

- 初始 SQL 移除比赛用户、比赛组织及其权限绑定，仅保留业务表结构、基础角色和数据标签；不自动删除现有企业数据库记录。
- 移除固定手机号/固定验证码认证，接入三平台一致的企业短信网关及 Redis 一次性校验。未配置时明确返回未接入，不能伪报发送成功。
- 删除缺失真实工作流时生成固定比赛成功证据的分支；真实记录及证据接口继续工作。
- 比赛数据集内存演练适配默认关闭，保留真实外部执行与治理引擎；产品标识和资源关联通过配置登记，不再隐式挂载固定比赛数据。
- 登录页跨平台导航改为部署配置，空配置不跳入历史比赛地址；移除默认公开演示账号说明，保留统一视觉。
- 保留证据工作区和恢复能力；不把特征漂移能力本身当作比赛入口删除。

## 验证

验证固定码拒绝、短信真实响应/限流/有效期/一次性消费、缺失工作流不产生假证据、治理与真实回读现有回归，以及前端单测和生产构建。备份存于 E:/SynapXnet/backups/mainline-transition-20261023/dataops。
