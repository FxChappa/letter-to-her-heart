import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSupabaseEnv } from './env';

describe('getSupabaseEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads the Vite Supabase variables directly', () => {
    vi.stubEnv('VITE_SUPABASE_URL', ' https://example.supabase.co ');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', ' publishable-example ');

    expect(getSupabaseEnv()).toEqual({
      url: 'https://example.supabase.co',
      key: 'publishable-example',
      configured: true,
      demoMode: false,
      error: null,
    });
  });

  it('returns the friendly configuration error when values are absent', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_ALLOW_DEMO_MODE', 'false');

    const result = getSupabaseEnv();

    expect(result.configured).toBe(false);
    expect(result.error).toContain('.env.local');
  });
});
