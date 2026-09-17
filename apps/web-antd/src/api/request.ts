/**
 * XnetDataops 请求客户端配置
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore, useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';

import {
  beginRequest,
  finishRequest,
  requestIsCurrent,
  type RequestContext,
} from '#/components/data-page/request-state';
import { refreshTokenApi } from './core';
import { normalizeRequestFailure } from './public-error';

const {
  apiURL,
  dsmApiURL,
  dimApiURL,
  ddvApiURL,
  tskApiURL,
  dqmApiURL,
  dgvApiURL,
  dasApiURL,
  dapApiURL,
  dmsApiURL,
  dobApiURL,
  dauApiURL,
} = useAppConfig(import.meta.env, import.meta.env.PROD);

const ORGANIZATION_SCOPE_KEY = 'synapxnet:organization-scope';

interface OrganizationScope {
  deptUid: null | string;
  teamUid: null | string;
  tenantUid: null | string;
}

/** 读取当前页签内的组织范围，解析失败时按未授权处理。 Read tab-local organization scope and return no scope on parsing failure. */
function readOrganizationScope(): null | OrganizationScope {
  try {
    const raw = globalThis.sessionStorage?.getItem(ORGANIZATION_SCOPE_KEY);
    return raw ? (JSON.parse(raw) as OrganizationScope) : null;
  } catch {
    return null;
  }
}

/** 将已选租户、部门和团队写入业务请求头，供服务端二次校验。 Attach the selected scope for authoritative server-side verification. */
function appendOrganizationScopeHeaders(headers: Record<string, any>) {
  const scope = readOrganizationScope();
  if (!scope?.tenantUid || !scope.deptUid || !scope.teamUid) return;
  headers['X-Tenant-Uid'] = scope.tenantUid;
  headers['X-Dept-Uid'] = scope.deptUid;
  headers['X-Team-Uid'] = scope.teamUid;
}

/** 创建携带组织范围、去重和响应代次保护的业务客户端。 Create a business client with scope headers, duplicate-write prevention and response freshness. */
function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
    timeout: 600_000,
  });

  /**
   * 清除失效会话并重新认证。 Clear the expired session and require authentication again.
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired. ');
    const authStore = useAuthStore();
    await authStore.forceLogout();
  }

  /**
   * 刷新令牌并更新会话监测。 Refresh the token and update session expiration monitoring.
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    useAuthStore().startSessionExpirationMonitor();
    return newToken;
  }

  /** 格式化当前身份令牌，不生成替代凭证。 Format the current token without inventing credentials. */
  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      const userStore = useUserStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      if (userStore.userInfo?.userId) {
        config.headers['X-User-Id'] = userStore.userInfo.userId;
      }
      appendOrganizationScopeHeaders(config.headers);
      // 记录业务请求的组织和端点代次。 Capture organization and endpoint generation for each business request.
      if (
        baseURL !== apiURL ||
        /^\/(users|roles|user-roles)(\/|$)/.test(config.url ?? '')
      )
        (
          config as typeof config & { dataopsContext?: RequestContext }
        ).dataopsContext = beginRequest(
          config.method ?? 'GET',
          baseURL + (config.url ?? ''),
        );
      return config;
    },
  });

  // 在解包前保留失败与最新请求状态。 Retain failure and freshness before unwrapping the response.
  client.addResponseInterceptor({
    fulfilled: (response) => {
      const context = (
        response.config as typeof response.config & {
          dataopsContext?: RequestContext;
        }
      ).dataopsContext;
      if (context) {
        const failure =
          response.data?.code !== undefined && response.data.code !== 0
            ? { response }
            : undefined;
        finishRequest(context, failure);
        if (!requestIsCurrent(context))
          throw Object.assign(new Error('请求范围已更新，请使用当前页面数据'), {
            dataopsStale: true,
          });
      }
      return response;
    },
    rejected: (error) => {
      const context = error?.config?.dataopsContext as
        | RequestContext
        | undefined;
      if (context) finishRequest(context, error);
      return Promise.reject(error);
    },
  });
  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const visibleMessage = normalizeRequestFailure(error, msg);
      // 业务请求由页面状态或局部错误区呈现，登录请求仍反馈。 / Business pages own inline failures; authentication retains feedback.
      if (!error?.config?.dataopsContext && !error?.dataopsStale) {
        message.error({ content: visibleMessage, key: 'request-error' });
      }
    }),
  );

  return client;
}

/**
 * 创建保留公共 ToolResponse 包络的 Agent 请求客户端。 Create an Agent client that preserves the public ToolResponse envelope.
 *
 * @param serviceBaseURL 领域服务原有 API 地址
 * @returns Agent 证据请求客户端
 */
function createAgentRequestClient(serviceBaseURL: string) {
  const baseURL = serviceBaseURL.replace(/\/api\/[^/]+\/?$/, '');
  const client = new RequestClient({
    baseURL,
    responseReturn: 'data',
    timeout: 60_000,
  });
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const token = useAccessStore().accessToken;
      config.headers.Authorization = token ? `Bearer ${token}` : null;
      config.headers['Accept-Language'] = preferences.app.locale;
      appendOrganizationScopeHeaders(config.headers);
      return config;
    },
  });
  return client;
}

// USR接口请求客户端 (用户认证，默认)
export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

// DSM接口请求客户端 (数据源管理)
export const dsmRequestClient = createRequestClient(dsmApiURL, {
  responseReturn: 'data',
});

// DIM接口请求客户端 (数据集成)
export const dimRequestClient = createRequestClient(dimApiURL, {
  responseReturn: 'data',
});

// DDV接口请求客户端 (数据开发)
export const ddvRequestClient = createRequestClient(ddvApiURL, {
  responseReturn: 'data',
});

// TSK接口请求客户端 (任务调度)
export const tskRequestClient = createRequestClient(tskApiURL, {
  responseReturn: 'data',
});

// DQM接口请求客户端 (数据质量)
export const dqmRequestClient = createRequestClient(dqmApiURL, {
  responseReturn: 'data',
});

// DGV接口请求客户端 (数据治理)
export const dgvRequestClient = createRequestClient(dgvApiURL, {
  responseReturn: 'data',
});

// DAS接口请求客户端 (数据资产)
export const dasRequestClient = createRequestClient(dasApiURL, {
  responseReturn: 'data',
});

// DAP接口请求客户端 (数据API)
export const dapRequestClient = createRequestClient(dapApiURL, {
  responseReturn: 'data',
});

// DMS接口请求客户端 (数据脱敏)
export const dmsRequestClient = createRequestClient(dmsApiURL, {
  responseReturn: 'data',
});

// DOB接口请求客户端 (数据可观测性)
export const dobRequestClient = createRequestClient(dobApiURL, {
  responseReturn: 'data',
});

// DAU接口请求客户端 (数据审计)
export const dauRequestClient = createRequestClient(dauApiURL, {
  responseReturn: 'data',
});

export const agentDqmRequestClient = createAgentRequestClient(dqmApiURL);
export const agentDgvRequestClient = createAgentRequestClient(dgvApiURL);
export const agentTskRequestClient = createAgentRequestClient(tskApiURL);

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
