/* Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：旧助手组件兼容边界。Purpose: Compatibility boundary for the legacy assistant component.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com */
import type {
  Assistant,
  AssistantConversation,
  AssistantMessage,
} from './types';
/** 当前DataOps没有助手服务契约，明确报告不可用。 Report unavailability because this DataOps branch has no assistant service contract. */
async function unavailable(): Promise<never> {
  throw new Error(
    '当前 DataOps 尚未接入独立智能助手服务，请在 OpenXnet 工作空间使用对话能力',
  );
}
/** 保留默认助手查询入口并报告缺失服务。 Preserve the default assistant query entry and report the missing service. */
export function fetchDefaultAssistant(): Promise<Assistant> {
  return unavailable();
}
/** 保留指定助手查询入口并报告缺失服务。 Preserve the selected assistant query entry and report the missing service. */
export function fetchAssistant(_id: number): Promise<Assistant> {
  return unavailable();
}
/** 服务缺失时拒绝创建会话，避免虚构成功。 Reject conversation creation while the service is absent rather than claiming success. */
export function createConversation(
  _assistantId: number,
  _userId: string,
  _name: string,
): Promise<AssistantConversation> {
  return unavailable();
}
/** 服务缺失时拒绝消息写入，避免丢失用户内容。 Reject message persistence while the service is absent to prevent silent loss. */
export function addMessage(
  _conversationId: number,
  _role: string,
  _content: string,
): Promise<AssistantMessage> {
  return unavailable();
}
