import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const currentRoute = {
    value: { fullPath: '/dashboard', path: '/dashboard' },
  };
  const accessStore = {
    accessToken: null as null | string,
    accessTokenExpiresAt: null as null | number,
    get isAccessTokenExpired() {
      return (
        this.accessToken !== null &&
        (this.accessTokenExpiresAt === null ||
          this.accessTokenExpiresAt <= Date.now())
      );
    },
    loginExpired: false,
    setAccessCodes: vi.fn(),
    setAccessToken(token: null | string) {
      this.accessToken = token;
    },
    setLoginExpired(value: boolean) {
      this.loginExpired = value;
    },
  };
  const resetAllStores = vi.fn(() => {
    accessStore.accessToken = null;
    accessStore.accessTokenExpiresAt = null;
  });
  const replace = vi.fn(async (route: { path: string }) => {
    currentRoute.value = { fullPath: route.path, path: route.path };
  });

  return {
    accessStore,
    currentRoute,
    logoutApi: vi.fn(),
    replace,
    resetAllStores,
    userStore: {
      setUserInfo: vi.fn(),
      userInfo: null,
    },
  };
});

vi.mock('vue-router', () => ({
  useRouter: () => ({
    currentRoute: mocks.currentRoute,
    push: vi.fn(),
    replace: mocks.replace,
  }),
}));

vi.mock('@vben/constants', () => ({
  DEFAULT_HOME_PATH: '/dashboard',
  LOGIN_PATH: '/auth/login',
}));

vi.mock('@vben/stores', () => ({
  getAccessTokenExpiresAt: () => mocks.accessStore.accessTokenExpiresAt,
  resetAllStores: mocks.resetAllStores,
  useAccessStore: () => mocks.accessStore,
  useUserStore: () => mocks.userStore,
}));

vi.mock('ant-design-vue', () => ({
  notification: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('#/api', () => ({
  getAccessCodesApi: vi.fn(),
  getUserInfoApi: vi.fn(),
  loginApi: vi.fn(),
  logoutApi: mocks.logoutApi,
}));

vi.mock('#/locales', () => ({
  $t: (key: string) => key,
}));

import { useAuthStore } from './auth';

describe('useAuthStore session expiration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 6, 28));
    vi.stubGlobal('window', { addEventListener: vi.fn() });
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      visibilityState: 'visible',
    });
    setActivePinia(createPinia());

    mocks.accessStore.accessToken = null;
    mocks.accessStore.accessTokenExpiresAt = null;
    mocks.currentRoute.value = {
      fullPath: '/dashboard',
      path: '/dashboard',
    };
    mocks.logoutApi.mockReset();
    mocks.replace.mockClear();
    mocks.resetAllStores.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('clears the session and redirects when the JWT reaches its expiry', async () => {
    mocks.accessStore.accessToken = 'token';
    mocks.accessStore.accessTokenExpiresAt = Date.now() + 1000;
    const store = useAuthStore();

    store.startSessionExpirationMonitor();
    await vi.advanceTimersByTimeAsync(1000);
    await Promise.resolve();

    expect(mocks.resetAllStores).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledWith({
      path: '/auth/login',
      query: { redirect: encodeURIComponent('/dashboard') },
    });
  });

  it('deduplicates concurrent forced logout requests', async () => {
    mocks.accessStore.accessToken = 'token';
    mocks.accessStore.accessTokenExpiresAt = Date.now() + 1000;
    const store = useAuthStore();

    await Promise.all([store.forceLogout(), store.forceLogout()]);

    expect(mocks.resetAllStores).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledOnce();
  });
});
