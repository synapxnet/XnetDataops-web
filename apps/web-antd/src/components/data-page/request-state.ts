/*
Copyright (C) 2026 Synapxnet. All rights reserved.
This file is Synapxnet Proprietary and Confidential. It is strictly
forbidden to copy, distribute, or use without explicit authorization.
用途：统一业务页面与外观。Purpose: Provide consistent business pages and appearance.
Author: maoyo | Department: 研发部 | Date: 2026-09-13 | Version: 1.0.0 | Security Level: INTERNAL
__version__: 1.0.0 | __author__: maoyo | __copyright__: Copyright 2026 Synapxnet
__maintainer__: maoyo | __email__: synapxnet@gmail.com
*/
import { reactive } from 'vue';
import { publicRequestMessage } from '#/api/public-error';
export interface RequestContext {
  page: string;
  scope: string;
  key: string;
  version: number;
  epoch: number;
  write: boolean;
}
interface PageState {
  pending: number;
  writePending: number;
  failures: Record<string, string>;
  writeError: string;
  dirty: boolean;
}
const states = reactive<Record<string, PageState>>({});
const versions = new Map<string, number>();
let epoch = 0;
const activeWrites = new Set<string>();
/** 读取当前页面定位，兼容hash和history路由。 Read the current page key for hash or history routing. */
export function currentPageKey() {
  return typeof location === 'undefined'
    ? ''
    : location.hash.startsWith('#/')
      ? location.hash.slice(1)
      : location.pathname + location.search;
}
/** 仅用浏览器组织作请求代次，不作为服务端授权证明。 Read browser scope for request freshness, never as authorization proof. */
export function currentScopeKey() {
  try {
    return sessionStorage.getItem('synapxnet:organization-scope') ?? '';
  } catch {
    return '';
  }
}
/** 获取页面内存态，业务响应不持久化。 Get transient page state without persisting business responses. */
export function pageState(key = currentPageKey()): PageState {
  return (
    states[key] ??
    (states[key] = {
      pending: 0,
      writePending: 0,
      failures: {},
      writeError: '',
      dirty: false,
    })
  );
}
/** 记录请求所属页面、组织和同端点代次。 Capture the page, scope and endpoint generation for a request. */
export function beginRequest(method: string, url: string): RequestContext {
  const page = currentPageKey(),
    scope = currentScopeKey(),
    key =
      page +
      '|' +
      scope +
      '|' +
      url
        .replace(/\/browser\/sources\/\d+/g, '/browser/sources/:source')
        .replace(/\/tables\/[^/]+\/(columns|preview)$/g, '/tables/:table/$1'),
    write =
      !['GET', 'HEAD'].includes(method.toUpperCase()) &&
      !/\/browser\/sources\/\d+\/query$/.test(url);
  if (write && activeWrites.has(key))
    throw new Error('操作正在提交，请勿重复提交');
  if (write) activeWrites.add(key);
  const version = (versions.get(key) ?? 0) + 1;
  versions.set(key, version);
  const state = pageState(page);
  state.pending++;
  if (write) {
    state.writePending++;
    state.writeError = '';
  } else delete state.failures[key];
  return { page, scope, key, version, epoch, write };
}
/** 校验请求仍属于同一组织和最新端点代次。 Check that the response still belongs to the same scope and latest endpoint generation. */
export function requestIsCurrent(context: RequestContext) {
  return (
    context.epoch === epoch &&
    context.scope === currentScopeKey() &&
    (context.write || versions.get(context.key) === context.version)
  );
}
/** 保留公开错误和读写状态，不将缺失数据当正常空结果。 Finish a request while retaining public errors and separate read/write state. */
export function finishRequest(context: RequestContext, reason?: unknown) {
  if (context.epoch !== epoch) return;
  if (context.write) activeWrites.delete(context.key);
  const state = pageState(context.page);
  state.pending = Math.max(0, state.pending - 1);
  if (context.write) state.writePending = Math.max(0, state.writePending - 1);
  if (!requestIsCurrent(context)) return;
  if (reason) {
    const message = publicRequestError(reason);
    if (context.write) state.writeError = message;
    else state.failures[context.key] = message;
  } else if (context.write) state.dirty = false;
}
/** 仅向页面提供稳定HTTP说明或后端公开message。 Expose stable HTTP explanations or a public backend message to the page. */
export function publicRequestError(reason: unknown): string {
  return publicRequestMessage(reason);
}
/** 组织变更时丢弃所有页面状态与未完成请求代次。 Discard every page state and generation when organization scope changes. */
export function clearPageStates() {
  epoch++;
  for (const key of Object.keys(states)) delete states[key];
  versions.clear();
  activeWrites.clear();
}
/** 返回是否存在用户未保存的表单。 Report whether any page has an unsaved user edit. */
export function hasUnsavedPages() {
  return Object.values(states).some((state) => state.dirty);
}
