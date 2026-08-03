import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasCompletedControlsTutorial, isTouchFirstDevice, markControlsTutorialComplete } from './tutorialStorage';

describe('controls tutorial preferences', () => {
  beforeEach(() => localStorage.clear());

  it('remembers completion locally', () => {
    expect(hasCompletedControlsTutorial()).toBe(false);
    markControlsTutorialComplete();
    expect(hasCompletedControlsTutorial()).toBe(true);
  });

  it('migrates an old completion key without losing progress', () => {
    localStorage.setItem('our-little-space-controls-tutorial', 'complete');
    expect(hasCompletedControlsTutorial()).toBe(true);
    localStorage.removeItem('our-little-space-controls-tutorial');
    expect(hasCompletedControlsTutorial()).toBe(true);
  });

  it('detects touch-first devices', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    expect(isTouchFirstDevice()).toBe(true);
  });
});
