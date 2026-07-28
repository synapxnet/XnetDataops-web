import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({
  afterEach: vi.fn(),
  beforeEach: vi.fn(),
  onError: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => router,
}));

vi.mock('@vben/preferences', () => ({
  preferences: {
    transition: {
      loading: true,
    },
  },
}));

import { useContentSpinner } from './use-content-spinner';

describe('useContentSpinner', () => {
  beforeEach(() => {
    router.afterEach.mockClear();
    router.beforeEach.mockClear();
    router.onError.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stops the spinner when navigation throws', () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(600);

    const { spinning } = useContentSpinner();
    const beforeGuard = router.beforeEach.mock.calls[0]?.[0];
    const errorHandler = router.onError.mock.calls[0]?.[0];

    beforeGuard({ meta: {} });
    expect(spinning.value).toBe(true);

    errorHandler(new Error('navigation failed'));
    expect(spinning.value).toBe(false);
  });
});
