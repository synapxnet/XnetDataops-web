import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getAccessTokenExpiresAt,
  isAccessTokenExpired,
  useAccessStore,
} from './access';

function createToken(expiresAt: number) {
  const payload = btoa(JSON.stringify({ exp: expiresAt / 1000 }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  return `header.${payload}.signature`;
}

describe('useAccessStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates accessMenus state', () => {
    const store = useAccessStore();
    expect(store.accessMenus).toEqual([]);
    store.setAccessMenus([{ name: 'Dashboard', path: '/dashboard' }]);
    expect(store.accessMenus).toEqual([
      { name: 'Dashboard', path: '/dashboard' },
    ]);
  });

  it('updates accessToken state correctly', () => {
    const store = useAccessStore();
    expect(store.accessToken).toBeNull(); // 初始状态
    store.setAccessToken('abc123');
    expect(store.accessToken).toBe('abc123');
  });

  it('returns the correct accessToken', () => {
    const store = useAccessStore();
    store.setAccessToken('xyz789');
    expect(store.accessToken).toBe('xyz789');
  });

  it('records the JWT expiration when the token changes', () => {
    const expiresAt = Date.UTC(2026, 6, 29);
    const store = useAccessStore();

    store.setAccessToken(createToken(expiresAt));

    expect(store.accessTokenExpiresAt).toBe(expiresAt);
    expect(getAccessTokenExpiresAt(store.accessToken)).toBe(expiresAt);
  });

  it('treats expired and malformed tokens as expired', () => {
    const now = Date.UTC(2026, 6, 28);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    expect(isAccessTokenExpired(createToken(now - 1000))).toBe(true);
    expect(isAccessTokenExpired(createToken(now + 1000))).toBe(false);
    expect(isAccessTokenExpired('invalid-token')).toBe(true);
  });

  it('derives expiration for a token restored from an older cache', () => {
    const now = Date.UTC(2026, 6, 28);
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const store = useAccessStore();

    store.$patch({
      accessToken: createToken(now - 1000),
      accessTokenExpiresAt: null,
    });

    expect(store.isAccessTokenExpired).toBe(true);
  });

  // 测试设置空的访问菜单列表
  it('handles empty accessMenus correctly', () => {
    const store = useAccessStore();
    store.setAccessMenus([]);
    expect(store.accessMenus).toEqual([]);
  });

  // 测试设置空的访问路由列表
  it('handles empty accessRoutes correctly', () => {
    const store = useAccessStore();
    store.setAccessRoutes([]);
    expect(store.accessRoutes).toEqual([]);
  });
});
