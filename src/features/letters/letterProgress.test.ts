import { describe, expect, it } from 'vitest';
import { isAcceptedUnlockAnswer, normalizeUnlockAnswer } from './letterProgress';
import { newChapter } from './newChapter';

describe('letter progress helpers', () => {
  it('accepts the preserved lifetime-of-nights passphrase', () => {
    expect(isAcceptedUnlockAnswer('I want a lifetime of nights with you')).toBe(true);
    expect(isAcceptedUnlockAnswer('a lifetime of nights with you')).toBe(true);
  });

  it('normalizes curly punctuation and spacing', () => {
    expect(normalizeUnlockAnswer('  I want a lifetime of nights with you...  ')).toBe('i want a lifetime of nights with you');
  });

  it('keeps the new chapter invitation separate from the girlfriend question', () => {
    const body = newChapter.paragraphs.join(' ').toLowerCase();
    expect(newChapter.title).toBe('A New Chapter');
    expect(body).toContain('come meet me in our space');
    expect(body).not.toContain('girlfriend');
  });
});
