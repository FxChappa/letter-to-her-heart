import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '../../lib/supabase/database.types';
import { useDateSequence } from './useDateSequence';

const profile = (role: Profile['role']): Profile => ({
  id: `${role}-id`,
  display_name: role === 'aldane' ? 'Aldane' : 'Santana',
  role,
  avatar_key: role,
  controls_tutorial_complete: true,
  new_chapter_completed_at: '2026-08-03T17:00:00.000Z',
  created_at: '2026-08-03T17:00:00.000Z',
  updated_at: '2026-08-03T17:00:00.000Z',
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDateSequence', () => {
  it('dismisses the accepted celebration and makes the date reusable', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ activeProfile }: { activeProfile: Profile }) => useDateSequence(activeProfile, true),
      { initialProps: { activeProfile: profile('aldane') } },
    );

    await act(async () => result.current.prepareDate());
    await act(async () => result.current.askNow());
    rerender({ activeProfile: profile('santana') });
    await act(async () => result.current.respondYes());
    expect(result.current.state.phase).toBe('accepted');

    await act(async () => vi.advanceTimersByTimeAsync(12000));
    expect(result.current.state.phase).toBe('normal');

    rerender({ activeProfile: profile('aldane') });
    expect(result.current.canPrepare).toBe(true);
  });
});
