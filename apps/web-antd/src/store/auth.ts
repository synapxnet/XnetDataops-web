import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DEFAULT_HOME_PATH, LOGIN_PATH } from '@vben/constants';
import {
  getAccessTokenExpiresAt,
  resetAllStores,
  useAccessStore,
  useUserStore,
} from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);
  const MAX_TIMER_DELAY = 2_147_483_647;
  let forceLogoutPromise: null | Promise<void> = null;
  let sessionExpirationTimer: ReturnType<typeof setTimeout> | undefined;
  let sessionMonitorStarted = false;

  function clearSessionExpirationTimer() {
    if (sessionExpirationTimer) {
      clearTimeout(sessionExpirationTimer);
      sessionExpirationTimer = undefined;
    }
  }

  function clearSession() {
    clearSessionExpirationTimer();
    resetAllStores();
    accessStore.setLoginExpired(false);
  }

  async function forceLogout(redirect: boolean = true) {
    if (forceLogoutPromise) {
      return forceLogoutPromise;
    }

    const currentRoute = router.currentRoute.value;
    const loginRoute = {
      path: LOGIN_PATH,
      query:
        redirect && currentRoute.path !== LOGIN_PATH
          ? { redirect: encodeURIComponent(currentRoute.fullPath) }
          : {},
    };

    forceLogoutPromise = (async () => {
      clearSession();
      if (router.currentRoute.value.path !== LOGIN_PATH) {
        await router.replace(loginRoute);
      }
    })();

    try {
      await forceLogoutPromise;
    } finally {
      forceLogoutPromise = null;
    }
  }

  function scheduleSessionExpiration() {
    clearSessionExpirationTimer();
    const token = accessStore.accessToken;
    if (!token) {
      return;
    }

    const expiresAt = getAccessTokenExpiresAt(token);
    if (expiresAt === null || expiresAt <= Date.now()) {
      void forceLogout();
      return;
    }

    if (accessStore.accessTokenExpiresAt !== expiresAt) {
      accessStore.setAccessToken(token);
    }

    sessionExpirationTimer = setTimeout(() => {
      sessionExpirationTimer = undefined;
      void forceLogout();
    }, Math.min(expiresAt - Date.now(), MAX_TIMER_DELAY));
  }

  function validateSessionExpiration() {
    if (accessStore.accessToken && accessStore.isAccessTokenExpired) {
      void forceLogout();
      return;
    }
    scheduleSessionExpiration();
  }

  function startSessionExpirationMonitor() {
    if (!sessionMonitorStarted) {
      sessionMonitorStarted = true;
      window.addEventListener('focus', validateSessionExpiration);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          validateSessionExpiration();
        }
      });
    }
    validateSessionExpiration();
  }

  /**
   * 跳转到登录页
   */
  async function redirectToLogin() {
    await forceLogout();
  }

  /**
   * 获取用户信息和权限码（带错误处理）
   */
  async function fetchUserAndPermissions() {
    try {
      const [userInfo, accessCodes] = await Promise.all([
        fetchUserInfo(),
        getAccessCodesApi(),
      ]);
      return { userInfo, accessCodes };
    } catch (error) {
      notification.error({
        message: $t('authentication.requestFailed'),
        description: $t('authentication.requestFailedDesc'),
        duration: 3,
      });
      await redirectToLogin();
      throw error;
    }
  }

  /**
   * 验证码登录
   * @param params 登录表单数据 { phoneNumber, code }
   */
  async function authCodeLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const query = {
        userPhone: params.phoneNumber,
        code: params.code,
      };
      const { accessToken } = await loginApi(query);

      if (accessToken) {
        accessStore.setAccessToken(accessToken);
        startSessionExpirationMonitor();

        const result = await fetchUserAndPermissions();

        if (!result) {
          return { userInfo: null };
        }

        userInfo = result.userInfo;
        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(result.accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(userInfo.homePath || DEFAULT_HOME_PATH);
        }

        if (userInfo?.realName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${
              userInfo?.realName
            }`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } catch (error) {
      console.error('Code login failed:', error);
      if (accessStore.accessToken) {
        await redirectToLogin();
      }
      return { userInfo: null };
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  /**
   * authLogin 保留兼容，实际调用 authCodeLogin
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    return authCodeLogin(params, onSuccess);
  }

  async function logout(redirect: boolean = true) {
    const token = accessStore.accessToken;
    await forceLogout(redirect);

    try {
      await logoutApi(token);
    } catch {
      // 本地会话已经清除，服务端退出仅做尽力处理
    }
  }

  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    try {
      userInfo = await getUserInfoApi();
      userStore.setUserInfo(userInfo);
      return userInfo;
    } catch (error) {
      console.error('Fetch user info failed:', error);
      userStore.setUserInfo(null);
      throw error;
    }
  }

  function $reset() {
    clearSessionExpirationTimer();
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    authCodeLogin,
    clearSession,
    fetchUserInfo,
    forceLogout,
    loginLoading,
    logout,
    startSessionExpirationMonitor,
  };
});
