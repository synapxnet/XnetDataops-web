/* Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：旧助手组件兼容边界。Purpose: Compatibility boundary for the legacy assistant component.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com */
export interface Assistant {
  id: number;
  name: string;
  avatar?: string;
  gatewayUrl?: string;
  uiConfig?: string | Record<string, any>;
  welcomeMessage?: string;
  description?: string;
  placeholder?: string;
}
export interface AssistantConversation {
  id: number;
  uid: string;
}
export interface AssistantMessage {
  id: number;
  uid: string;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string;
}
