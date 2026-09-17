/*
 * Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 请求错误公开边界。 / Public boundary for request errors.
 * Author: maoyo | Department: 研发部 | Date: 2026-09-15 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
type Failure = {
  code?: number | string;
  message?: unknown;
  response?: { status?: number; data?: { code?: number | string; message?: unknown; error?: unknown } };
};

/** 保留业务失败语义，屏蔽框架异常、路径和数据库细节。 / Preserve failure semantics while excluding framework, path and database internals. */
export function publicRequestMessage(reason: unknown, fallback = ''): string {
  const error = reason as Failure | null;
  const data = error?.response?.data;
  const status = Number(data?.code ?? error?.code ?? error?.response?.status);
  const raw = data?.message ?? data?.error ?? error?.message ?? fallback;
  const message = typeof raw === 'string' ? raw.trim() : '';
  if (/network error|failed to fetch|ERR_NETWORK/i.test(message)) return '网络连接已中断，请检查连接后重试';
  if (/timeout|ECONNABORTED|ETIMEDOUT/i.test(message)) return '请求超时，请稍后重试';
  const known: Record<number, string> = {
    401: '登录已失效，请重新登录',
    403: '当前组织没有此操作权限',
    404: '当前资源不可用，请刷新后重试',
    409: '资源状态已变化，请刷新后重试',
    429: '请求较频繁，请稍后重试',
    500: '服务处理失败，请稍后重试',
    502: '服务暂时无法连接，请稍后重试',
    503: '服务暂不可用，请稍后重试',
    504: '服务响应超时，请稍后重试',
  };
  if (known[status]) return known[status];
  if (/no static resource|internal server error|not found|exception|jdbc|sql|traceback|<html|\/api\//i.test(message)) {
    return '服务处理失败，请稍后重试';
  }
  return /[\u4e00-\u9fff]/.test(message) && message.length <= 200
    ? message
    : '请求未完成，请稍后重试';
}

/** 让页面捕获同一公开说明，保留HTTP与业务错误码用于恢复。 / Let page handlers receive the same public message while preserving recovery codes. */
export function normalizeRequestFailure(reason: any, fallback = ''): string {
  const visible = publicRequestMessage(reason, fallback);
  if (reason && typeof reason === 'object') {
    reason.message = visible;
    if (reason.response?.data && typeof reason.response.data === 'object') {
      reason.response.data = { ...reason.response.data, message: visible, error: visible };
    }
  }
  return visible;
}
