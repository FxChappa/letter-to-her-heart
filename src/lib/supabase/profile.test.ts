import { describe, expect, it } from 'vitest';
import { canUseOwnerControls, getOtherRole, isPrivateRole } from './profile';

describe('profile helpers', () => {
  it('accepts only the two private roles', () => {
    expect(isPrivateRole('aldane')).toBe(true);
    expect(isPrivateRole('santana')).toBe(true);
    expect(isPrivateRole('guest')).toBe(false);
  });

  it('keeps owner controls private to Aldane', () => {
    expect(canUseOwnerControls({ role: 'aldane' })).toBe(true);
    expect(canUseOwnerControls({ role: 'santana' })).toBe(false);
    expect(canUseOwnerControls(null)).toBe(false);
  });

  it('finds the other private role for presence status', () => {
    expect(getOtherRole('aldane')).toBe('santana');
    expect(getOtherRole('santana')).toBe('aldane');
  });
});
