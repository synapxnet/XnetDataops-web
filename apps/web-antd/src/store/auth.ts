import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DEFAULT_HOME_PATH, LOGIN_PATH } from '@vben/constants';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getAccessCodesApi, getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 跳转到登录页
   */
  async function redirectToLogin() {
    resetAllStores();
    await router.replace({
      path: LOGIN_PATH,
      query: {
        redirect: encodeURIComponent(router.currentRoute.value.fullPath),
      },
    });
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
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
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
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
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
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    authCodeLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
