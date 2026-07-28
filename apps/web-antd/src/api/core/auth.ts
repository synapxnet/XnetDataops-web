import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    userPhone?: string;
    code?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    userId: number;
    username: string;
    userType: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/**
 * 发送短信验证码
 */
export async function getCodeData(data: { userPhone: string }) {
  return requestClient.post('/sms-code', data);
}

/**
 * 验证码登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/login', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi(accessToken: null | string) {
  return baseRequestClient.post('/logout', undefined, {
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
